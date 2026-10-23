// Server-only: opens the SQLite database and applies pending migrations.
// Never import this file from a "use client" component.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedCatalog } from "./seed";

const DB_PATH = process.env.HARVO_DB_PATH ?? path.join(process.cwd(), "data", "harvo.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/** Applies db/migrations/NNN_*.sql files newer than the database's user_version. */
function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const version = Number(file.slice(0, 3));
    if (version <= current) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    })();
  }
}

function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  seedCatalog(db);
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { harvoDb?: Database.Database };

export function getDb() {
  globalForDb.harvoDb ??= open();
  return globalForDb.harvoDb;
}
