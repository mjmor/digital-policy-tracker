"use server";

import { db } from "@/lib/db";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";
import type { ReviewStatus, StoredEvent } from "@/lib/event-types";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Sync: pull from DPA and store as pending
// ---------------------------------------------------------------------------

export async function syncEvents(
  params: DpaApiRequest
): Promise<{ added: number; duplicates: number; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/dpa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      // Use a short cache-busting tag so we always get fresh data on sync
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      return { added: 0, duplicates: 0, error: err.error ?? `HTTP ${res.status}` };
    }

    const rawData = (await res.json()) as DpaApiResponse;
    const events = rawData ?? [];
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO events (
        id, dpa_id, title, url, description, date, status,
        event_type, action_type, implementers, policy_area,
        policy_instrument, economic_activities, implementation_level,
        synced_at, review_status
      ) VALUES (
        @id, @dpa_id, @title, @url, @description, @date, @status,
        @event_type, @action_type, @implementers, @policy_area,
        @policy_instrument, @economic_activities, @implementation_level,
        @synced_at, 'pending'
      )
    `);

    let added = 0;
    let duplicates = 0;

    const insertMany = db.transaction((evts: DpaApiResponse) => {
      for (const evt of evts) {
        const result = insert.run({
          id: randomUUID(),
          dpa_id: evt.id,
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
  days = 30
): Promise<{ events: StoredEvent[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE review_status = 'pending'
         AND date >= ?
       ORDER BY date DESC`
    )
    .all(cutoffStr.slice(0, 10)) as StoredEvent[];

  return { events: rows.map(rowToEvent) };
}

export async function getArchived(): Promise<{ events: StoredEvent[] }> {
  const rows = db
    .prepare(
      `SELECT * FROM events
       WHERE review_status = 'archived'
       ORDER BY archived_at DESC`
    )
    .all() as StoredEvent[];

  return { events: rows.map(rowToEvent) };
}

export async function getStats(): Promise<{
  pending: number;
  reviewed: number;
  archived: number;
  lastSynced: string | null;
}> {
  const pending = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE review_status = 'pending'`).get() as { c: number }
  ).c;
  const reviewed = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE review_status = 'reviewed'`).get() as { c: number }
  ).c;
  const archived = (
    db.prepare(`SELECT COUNT(*) as c FROM events WHERE review_status = 'archived'`).get() as { c: number }
  ).c;
  const lastSynced = (
    db
      .prepare(`SELECT MAX(synced_at) as s FROM events`)
      .get() as { s: string | null }
  ).s;

  return { pending, reviewed, archived, lastSynced };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function reviewEvent(id: string): Promise<{ success: boolean }> {
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'reviewed', reviewed_at = ? WHERE id = ?`
    )
    .run(new Date().toISOString(), id);
  return { success: result.changes > 0 };
}

export async function archiveEvent(id: string): Promise<{ success: boolean }> {
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'archived', archived_at = ? WHERE id = ?`
    )
    .run(new Date().toISOString(), id);
  return { success: result.changes > 0 };
}

export async function restoreEvent(id: string): Promise<{ success: boolean }> {
  const result = db
    .prepare(
      `UPDATE events SET review_status = 'pending', reviewed_at = NULL, archived_at = NULL WHERE id = ?`
    )
    .run(new Date().toISOString(), id);
  return { success: result.changes > 0 };
}

export async function deleteEvent(id: string): Promise<{ success: boolean }> {
  const result = db
    .prepare(`DELETE FROM events WHERE id = ?`)
    .run(id);
  return { success: result.changes > 0 };
}
