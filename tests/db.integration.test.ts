import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { getDb } from "../lib/db";

const TEST_EVENT = {
  id: 20442,
  title: "Singapore AI Governance Framework",
  url: "https://digitalpolicyalert.org/event/20442",
  description: "Adopted second edition model AI governance framework",
  date: "2024-01-21",
  status: "adopted",
  event_type: "outline",
  action_type: "adoption",
  implementers: [{ name: "Singapore", id: 702 }],
  implementer_groups: [{ name: "Singapore" }],
  policy_area: "Design and testing standards",
  policy_instrument: "Artificial Intelligence authority governance",
  economic_activities: [{ name: "ML and AI development", id: 9 }],
  implementation_level: "national",
};

const TEST_PLAN_ID = "test-plan-id";

describe("getDb()", () => {
  let db: ReturnType<typeof getDb>;

  beforeEach(() => {
    db = getDb();
    db.prepare(`
      INSERT INTO search_plans (id, title, dpa_filters, created_at)
      VALUES (?, ?, ?, ?)
    `).run(TEST_PLAN_ID, "Test Plan", "{}", new Date().toISOString());
  });

  afterEach(() => {
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM search_plans").run();
  });

  // -------------------------------------------------------------------------
  // Insert
  // -------------------------------------------------------------------------
  describe("insert", () => {
    it("inserts an event and retrieves it by dpa_id", () => {
      const now = new Date().toISOString();
      db.prepare(`
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
      `).run({
        id: randomUUID(),
        dpa_id: TEST_EVENT.id,
        search_plan_id: TEST_PLAN_ID,
        title: TEST_EVENT.title,
        url: TEST_EVENT.url,
        description: TEST_EVENT.description,
        date: TEST_EVENT.date,
        status: TEST_EVENT.status,
        event_type: TEST_EVENT.event_type,
        action_type: TEST_EVENT.action_type,
        implementers: JSON.stringify(TEST_EVENT.implementers),
        policy_area: TEST_EVENT.policy_area,
        policy_instrument: TEST_EVENT.policy_instrument,
        economic_activities: JSON.stringify(TEST_EVENT.economic_activities),
        implementation_level: TEST_EVENT.implementation_level,
        synced_at: now,
      });

      const row = db
        .prepare("SELECT * FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id) as Record<string, unknown>;

      expect(row.dpa_id).toBe(TEST_EVENT.id);
      expect(row.title).toBe(TEST_EVENT.title);
      expect(row.review_status).toBe("pending");
    });

    it("INSERT OR IGNORE prevents duplicate (dpa_id, search_plan_id)", () => {
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

      const r1 = insert.run({ ...eventRow(now, "pending", TEST_PLAN_ID), id: randomUUID() });
      const r2 = insert.run({ ...eventRow(now, "pending", TEST_PLAN_ID), id: randomUUID() });

      expect(r1.changes).toBe(1);
      expect(r2.changes).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Review workflow
  // -------------------------------------------------------------------------
  describe("review workflow", () => {
    it("starts with pending status", () => {
      insertTestEvent(db);
      const row = db
        .prepare("SELECT review_status FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id) as { review_status: string };
      expect(row.review_status).toBe("pending");
    });

    it("can be marked as reviewed", () => {
      insertTestEvent(db);
      db.prepare(
        "UPDATE events SET review_status = 'reviewed', reviewed_at = ? WHERE dpa_id = ?"
      ).run(new Date().toISOString(), TEST_EVENT.id);

      const row = db
        .prepare("SELECT review_status, reviewed_at FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id) as { review_status: string; reviewed_at: string | null };
      expect(row.review_status).toBe("reviewed");
      expect(row.reviewed_at).not.toBeNull();
    });

    it("can be archived", () => {
      insertTestEvent(db);
      db.prepare(
        "UPDATE events SET review_status = 'archived', archived_at = ? WHERE dpa_id = ?"
      ).run(new Date().toISOString(), TEST_EVENT.id);

      const row = db
        .prepare("SELECT review_status FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id) as { review_status: string };
      expect(row.review_status).toBe("archived");
    });

    it("can be restored from archived to pending", () => {
      insertTestEvent(db, "archived");
      db.prepare(
        "UPDATE events SET review_status = 'pending', archived_at = NULL WHERE dpa_id = ?"
      ).run(TEST_EVENT.id);

      const row = db
        .prepare("SELECT review_status FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id) as { review_status: string };
      expect(row.review_status).toBe("pending");
    });

    it("restore by UUID id updates correct event", () => {
      // Regression: restoreEvent was calling .run(timestamp, id) with two args
      // but SQL has one ?, so timestamp was bound to ? and id was ignored — nothing matched.
      insertTestEvent(db, "archived", "restore-uuid");
      db.prepare(
        "UPDATE events SET review_status = 'pending', reviewed_at = NULL, archived_at = NULL WHERE id = ?"
      ).run("restore-uuid");

      const row = db
        .prepare("SELECT review_status FROM events WHERE id = ?")
        .get("restore-uuid") as { review_status: string };
      expect(row.review_status).toBe("pending");
    });

    it("can be deleted permanently", () => {
      insertTestEvent(db);
      db.prepare("DELETE FROM events WHERE dpa_id = ?").run(TEST_EVENT.id);
      const row = db
        .prepare("SELECT dpa_id FROM events WHERE dpa_id = ?")
        .get(TEST_EVENT.id);
      expect(row).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Query helpers
  // -------------------------------------------------------------------------
  describe("query helpers", () => {
    beforeEach(() => {
      insertTestEvent(db, "pending", "event-1", 1001, "2024-01-01");
      insertTestEvent(db, "reviewed", "event-2", 1002, "2024-01-10");
      insertTestEvent(db, "archived", "event-3", 1003, "2024-01-20");
      insertTestEvent(db, "pending", "event-4", 1004, "2024-02-01");
    });

    it("counts pending events correctly", () => {
      const row = db
        .prepare("SELECT COUNT(*) as c FROM events WHERE review_status = 'pending'")
        .get() as { c: number };
      expect(row.c).toBe(2);
    });

    it("counts reviewed events correctly", () => {
      const row = db
        .prepare("SELECT COUNT(*) as c FROM events WHERE review_status = 'reviewed'")
        .get() as { c: number };
      expect(row.c).toBe(1);
    });

    it("returns pending events ordered by date descending", () => {
      const rows = db
        .prepare(
          "SELECT dpa_id FROM events WHERE review_status = 'pending' ORDER BY date DESC"
        )
        .all() as { dpa_id: number }[];
      expect(rows.map((r) => r.dpa_id)).toEqual([1004, 1001]);
    });

    it("filters pending events by date cutoff", () => {
      const rows = db
        .prepare(
          "SELECT dpa_id FROM events WHERE review_status = 'pending' AND date >= ?"
        )
        .all("2024-01-15") as { dpa_id: number }[];
      expect(rows.map((r) => r.dpa_id)).toEqual([1004]);
    });

    it("all-status date query returns events of every review_status", () => {
      // Regression: getReviewQueue had WHERE review_status = 'pending' so reviewed
      // and archived events were never loaded, making those tabs always empty.
      const rows = db
        .prepare(
          "SELECT dpa_id, review_status FROM events WHERE date >= ? ORDER BY date DESC"
        )
        .all("2023-01-01") as { dpa_id: number; review_status: string }[];
      const statuses = rows.map((r) => r.review_status);
      expect(statuses).toContain("pending");
      expect(statuses).toContain("reviewed");
      expect(statuses).toContain("archived");
    });

    it("returns last synced timestamp", () => {
      const row = db
        .prepare("SELECT MAX(synced_at) as s FROM events")
        .get() as { s: string | null };
      expect(row.s).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function eventRow(now: string, reviewStatus = "pending", searchPlanId = "test-plan-id") {
  return {
    dpa_id: TEST_EVENT.id,
    search_plan_id: searchPlanId,
    title: TEST_EVENT.title,
    url: TEST_EVENT.url,
    description: TEST_EVENT.description,
    date: TEST_EVENT.date,
    status: TEST_EVENT.status,
    event_type: TEST_EVENT.event_type,
    action_type: TEST_EVENT.action_type,
    implementers: JSON.stringify(TEST_EVENT.implementers),
    policy_area: TEST_EVENT.policy_area,
    policy_instrument: TEST_EVENT.policy_instrument,
    economic_activities: JSON.stringify(TEST_EVENT.economic_activities),
    implementation_level: TEST_EVENT.implementation_level,
    synced_at: now,
    review_status: reviewStatus,
  };
}

function insertTestEvent(
  db: ReturnType<typeof getDb>,
  reviewStatus = "pending",
  id = "test-id",
  dpaId = TEST_EVENT.id,
  date = TEST_EVENT.date,
  searchPlanId = "test-plan-id"
) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO events (
      id, dpa_id, search_plan_id, title, url, description, date, status,
      event_type, action_type, implementers, policy_area,
      policy_instrument, economic_activities, implementation_level,
      synced_at, review_status
    ) VALUES (
      @id, @dpa_id, @search_plan_id, @title, @url, @description, @date, @status,
      @event_type, @action_type, @implementers, @policy_area,
      @policy_instrument, @economic_activities, @implementation_level,
      @synced_at, @review_status
    )
  `).run({
    id,
    dpa_id: dpaId,
    search_plan_id: searchPlanId,
    title: TEST_EVENT.title,
    url: TEST_EVENT.url,
    description: TEST_EVENT.description,
    date,
    status: TEST_EVENT.status,
    event_type: TEST_EVENT.event_type,
    action_type: TEST_EVENT.action_type,
    implementers: JSON.stringify(TEST_EVENT.implementers),
    policy_area: TEST_EVENT.policy_area,
    policy_instrument: TEST_EVENT.policy_instrument,
    economic_activities: JSON.stringify(TEST_EVENT.economic_activities),
    implementation_level: TEST_EVENT.implementation_level,
    synced_at: now,
    review_status: reviewStatus,
  });
}
