// Creates or updates the database tables from db/migrations/*.sql (in name order).
// Each file runs once, inside a transaction, and is recorded in schema_migrations.
//
//   npm run db:migrate                         show what would run on the development database
//   npm run db:migrate -- --apply              run it on the development database
//   npm run db:migrate -- --prod --apply --confirm=<project-id>   run it on the LIVE database

import fs from "node:fs";
import path from "node:path";
import { openTarget } from "./db-env.mjs";

const apply = process.argv.includes("--apply");
const { sql, label, redact } = openTarget();
const dir = path.join(process.cwd(), "db", "migrations");

try {
  console.log(`\n${label}`);
  // A dry run only reads: the tracking table is created only when --apply is used.
  const [{ exists }] = await sql`select to_regclass('public.schema_migrations') is not null as exists`;
  if (!exists && apply) {
    await sql`create table schema_migrations (
      version text primary key, applied_at timestamptz not null default now())`;
  }
  const done = new Set(exists || apply ? (await sql`select version from schema_migrations`).map((r) => r.version) : []);

  const files = fs.readdirSync(dir).filter((f) => /^\d{3}_[\w-]+\.sql$/.test(f)).sort();
  const pending = files.filter((f) => !done.has(f));
  for (const f of files) console.log(`  ${done.has(f) ? "done   " : "pending"}  ${f}`);

  if (!pending.length) console.log("\nNothing to do: the database is up to date.");
  else if (!apply) console.log(`\nDry run: ${pending.length} migration(s) would run. Add --apply to run them.`);
  else {
    for (const f of pending) {
      await sql.begin(async (tx) => {
        await tx.unsafe(fs.readFileSync(path.join(dir, f), "utf8"));
        await tx`insert into schema_migrations (version) values (${f})`;
      });
      console.log(`  applied  ${f}`);
    }
    console.log("\nDone.");
  }
} catch (err) {
  console.error(`\nFailed (nothing from the failing file was saved): ${redact(err.message)}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
