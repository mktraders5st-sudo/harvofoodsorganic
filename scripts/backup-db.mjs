// Makes a consistent copy of the database, safe to run while the site is live.
// Usage:  npm run backup               → backups/harvo-YYYY-MM-DD-HHMM.db
//         npm run backup -- /path/dir  → into another folder
// Keeps the 30 newest backups in the folder and deletes older ones.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.HARVO_DB_PATH ?? path.join(process.cwd(), "data", "harvo.db");
const dir = path.resolve(process.argv[2] ?? path.join(process.cwd(), "backups"));
const KEEP = 30;

if (!fs.existsSync(dbPath)) {
  console.error(`No database found at ${dbPath}. Nothing to back up.`);
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
const target = path.join(dir, `harvo-${stamp}.db`);

const db = new Database(dbPath, { readonly: true });
await db.backup(target); // SQLite online backup: consistent even during writes
db.close();

const backups = fs.readdirSync(dir).filter((f) => /^harvo-.*\.db$/.test(f)).sort();
for (const old of backups.slice(0, Math.max(0, backups.length - KEEP))) fs.unlinkSync(path.join(dir, old));

console.log(`Backup saved: ${target} (${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
