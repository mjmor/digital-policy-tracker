"use server";

import { getDb } from "@/lib/db";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";
import type { ReviewStatus, StoredEvent, SearchPlan, CreateSearchPlanInput } from "@/lib/event-types";
import { randomUUID } from "crypto";

import Database from "better-sqlite3";

// ---------------------------------------------------------------------------
// Search plan CRUD
// ---------------------------------------------------------------------------

export async function createSearchPlan(
  input: CreateSearchPlanInput
): Promise<{ plan?: SearchPlan; error?: string }> {
  try {
    const db = getDb();
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const dpa_filters = JSON.stringify(input.dpa_filters);

    db.prepare(`
      INSERT INTO search_plans (id, title, description, url, dpa_filters, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.title, input.description ?? null, input.url ?? null, dpa_filters, created_at);

    const plan = db
      .prepare("SELECT * FROM search_plans WHERE id = ?")
      .get(id) as SearchPlan;

    return { plan };
  } catch (err) {
    console.error("[createSearchPlan]", err);
    return { error: "Failed to create search plan." };
  }
}

export async function listSearchPlans(): Promise<{ plans: SearchPlan[] }> {
  try {
    const db = getDb();
    const plans = db
      .prepare("SELECT * FROM search_plans ORDER BY created_at DESC")
      .all() as SearchPlan[];
    return { plans };
  } catch (err) {
    console.error("[listSearchPlans]", err);
    return { plans: [] };
  }
}

export async function getSearchPlan(
  id: string
): Promise<{ plan?: SearchPlan; error?: string }> {
  try {
    const db = getDb();
    const plan = db
      .prepare("SELECT * FROM search_plans WHERE id = ?")
      .get(id) as SearchPlan | undefined;

    if (!plan) return { error: "Search plan not found." };
    return { plan };
  } catch (err) {
    console.error("[getSearchPlan]", err);
    return { error: "Failed to get search plan." };
  }
}

export async function deleteSearchPlan(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    db.prepare("DELETE FROM events WHERE search_plan_id = ?").run(id);
    const result = db.prepare("DELETE FROM search_plans WHERE id = ?").run(id);
    return { success: result.changes > 0 };
  } catch (err) {
    console.error("[deleteSearchPlan]", err);
    return { success: false, error: "Failed to delete search plan." };
  }
}

// ---------------------------------------------------------------------------
// Sync: pull from DPA and store as pending
// ---------------------------------------------------------------------------

export async function syncEvents(
  searchPlanId: string
): Promise<{ added: number; duplicates: number; error?: string }> {
  try {
    const apiKey = process.env.DPA_API_KEY;
    if (!apiKey) {
      return { added: 0, duplicates: 0, error: "DPA_API_KEY not configured" };
    }

    const db = getDb();
    const plan = db
      .prepare("SELECT * FROM search_plans WHERE id = ?")
      .get(searchPlanId) as SearchPlan | undefined;

    if (!plan) {
      return { added: 0, duplicates: 0, error: "Search plan not found." };
    }

    const params: DpaApiRequest = JSON.parse(plan.dpa_filters);

    const res = await fetch("https://api.globaltradealert.org/api/v1/dpa/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `APIKey ${apiKey}`,
      },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    if (!res.ok) {
      return { added: 0, duplicates: 0, error: `DPA API error: ${res.status}` };
    }

    const rawData = (await res.json()) as DpaApiResponse;
    const events = rawData ?? [];
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO events (
        id, dpa_id, search_plan_id, title, url, description, date, status,
        event_type, action_type, implementers, policy_area,
        policy_instrument, economic_activities, implementation_level,
        synced_at, review_status
      ) VALUES (
        @id, @dpa_id, @search_plan_id, @title, @url, @description, @date, @status,
        @event_type, @action_type, @implementers, @policy_area,
        @policy_instrument, @economic_activities, @implementation_level,
        @synced_at, 'pending'
      )
    `);

    let added = 0;
    let duplicates = 0;

    const insertMany = db.transaction(function (this: Database.Database, evts: DpaApiResponse) {
      for (const evt of evts) {
        const result = insert.run({
          id: randomUUID(),
          dpa_id: evt.id,
          search_plan_id: searchPlanId,
          title: evt.title,
          url: evt.url,
          description: evt.description ?? "",
          date: evt.date,
          status: evt.status ?? "",
          event_type: evt.event_type ?? "",
          action_type: evt.action_type ?? "",
          implementers: JSON.stringify(evt.implementers ?? []),
          policy_area: evt.policy_area ?? "",
          policy_instrument: evt.policy_instrument ?? "",
          economic_activities: JSON.stringify(evt.economic_activities ?? []),
          implementation_level: evt.implementation_level ?? "",
          synced_at: now,
        });
        if (result.changes === 0) duplicates++;
        else added++;
      }
    });

    insertMany(events);

    return { added, duplicates };
  } catch (err) {
    console.error("[syncEvents]", err);
    return { added: 0, duplicates: 0, error: "Sync failed — check server logs." };
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function rowToEvent(row: StoredEvent) {
  return {
    ...row,
    implementers: JSON.parse(row.implementers),
    economic_activities: JSON.parse(row.economic_activities),
  };
}

export async function getReviewQueue(
  searchPlanId: string,
  days = 365
): Promise<{ events: StoredEvent[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE search_plan_id = ? AND date >= ?
       ORDER BY date DESC`
    )
    .all(searchPlanId, cutoffStr.slice(0, 10)) as StoredEvent[];

  return { events: rows };
}

export async function getArchived(): Promise<{ events: StoredEvent[] }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE review_status = 'archived'
       ORDER BY archived_at DESC`
    )
    .all() as StoredEvent[];

  return { events: rows };
}

export async function getStats(searchPlanId: string): Promise<{
  pending: number;
  reviewed: number;
  archived: number;
  lastSynced: string | null;
}> {
  const db = getDb();
  const pending = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE search_plan_id = ? AND review_status = 'pending'`).get(searchPlanId) as { c: number }
  ).c;
  const reviewed = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE search_plan_id = ? AND review_status = 'reviewed'`).get(searchPlanId) as { c: number }
  ).c;
  const archived = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE search_plan_id = ? AND review_status = 'archived'`).get(searchPlanId) as { c: number }
  ).c;
  const lastSynced = (
    db
      .prepare(`SELECT MAX(synced_at) as s FROM events WHERE search_plan_id = ?`)
      .get(searchPlanId) as { s: string | null }
  ).s;

  return { pending, reviewed, archived, lastSynced };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function reviewEvent(id: string): Promise<{ success: boolean }> {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'reviewed', reviewed_at = ? WHERE id = ?`
    )
    .run(new Date().toISOString(), id);
  return { success: result.changes > 0 };
}

export async function archiveEvent(id: string): Promise<{ success: boolean }> {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'archived', archived_at = ? WHERE id = ?`
    )
    .run(new Date().toISOString(), id);
  return { success: result.changes > 0 };
}

export async function restoreEvent(id: string): Promise<{ success: boolean }> {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'pending', reviewed_at = NULL, archived_at = NULL WHERE id = ?`
    )
    .run(id);
  return { success: result.changes > 0 };
}

export async function deleteEvent(id: string): Promise<{ success: boolean }> {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM events WHERE id = ?`)
    .run(id);
  return { success: result.changes > 0 };
}
