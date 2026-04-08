import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { initializeSchema } from "./schema";

const DATA_DIR = path.join(process.cwd(), ".data");

// Ensure .data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "events.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return _db;
}

// For convenience
export const db = getDb();
