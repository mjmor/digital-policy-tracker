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

describe("getDb()", () => {
  let db: ReturnType<typeof getDb>;

  beforeEach(() => {
    db = getDb();
  });

  afterEach(() => {
    db.prepare("DELETE FROM events").run();
  });

  // -------------------------------------------------------------------------
  // Insert
  // -------------------------------------------------------------------------
  describe("insert", () => {
    it("inserts an event and retrieves it by dpa_id", () => {
      const now = new Date().toISOString();
      db.prepare(`
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
      `).run({
        id: randomUUID(),
        dpa_id: TEST_EVENT.id,
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

    it("INSERT OR IGNORE prevents duplicate dpa_id", () => {
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

      const r1 = insert.run({ ...eventRow(now), id: randomUUID() });
      const r2 = insert.run({ ...eventRow(now), id: randomUUID() });

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
function eventRow(now: string, reviewStatus = "pending") {
  return {
    dpa_id: TEST_EVENT.id,
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
  date = TEST_EVENT.date
) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO events (
      id, dpa_id, title, url, description, date, status,
      event_type, action_type, implementers, policy_area,
      policy_instrument, economic_activities, implementation_level,
      synced_at, review_status
    ) VALUES (
      @id, @dpa_id, @title, @url, @description, @date, @status,
      @event_type, @action_type, @implementers, @policy_area,
      @policy_instrument, @economic_activities, @implementation_level,
      @synced_at, @review_status
    )
  `).run({
    id,
    dpa_id: dpaId,
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
