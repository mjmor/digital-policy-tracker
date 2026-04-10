import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.NODE_ENV === "production"
    ? "/tmp/.data"
    : path.join(process.cwd(), ".data"));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "events.db");

let _db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.exec(`
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
        implementers TEXT,
        policy_area  TEXT,
        policy_instrument TEXT,
        economic_activities TEXT,
        implementation_level TEXT,
        synced_at    TEXT NOT NULL,
        review_status TEXT NOT NULL DEFAULT 'pending',
        reviewed_at  TEXT,
        archived_at  TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_events_review_status ON events(review_status);
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_events_synced_at ON events(synced_at);
    `);
  }
  return _db;
}

// Convenience alias — prefer getDb() for new code
export const db = {
  prepare(sql: string) {
    return getDb().prepare(sql);
  },
  exec(sql: string) {
    return getDb().exec(sql);
  },
  transaction<T>(fn: (this: Database.Database) => T) {
    return getDb().transaction(fn);
  },
};
