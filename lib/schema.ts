import { db } from "./db";

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id           TEXT PRIMARY KEY,
      dpa_id       INTEGER UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      url          TEXT NOT NULL,
      description  TEXT,
      date         TEXT NOT NULL,
      status       TEXT,
      event_type   TEXT,
      action_type  TEXT,
      implementers TEXT,         -- JSON string
      policy_area  TEXT,
      policy_instrument TEXT,
      economic_activities TEXT, -- JSON string
      implementation_level TEXT,
      synced_at    TEXT NOT NULL, -- ISO timestamp
      review_status TEXT NOT NULL DEFAULT 'pending',
      reviewed_at  TEXT,
      archived_at  TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_events_review_status ON events(review_status);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_synced_at ON events(synced_at);
  `);
}
