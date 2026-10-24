// Development-only local PostgreSQL (PGlite) for testing on this computer.
// Start: npm run db:local   Stop: Ctrl+C
// Listens on 127.0.0.1:5433 only (not reachable from other devices). Data: tools/local-db/data/
// PGlite has no passwords: any program on this computer can connect while it runs. Test data only.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const HOST = "127.0.0.1";
const PORT = 5433;
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");

const db = await PGlite.create(dataDir);

// Supabase has two public API roles. Create empty local copies so the same migrations
// (which lock tables down against these roles) run unchanged here.
await db.exec(`
  do $$ begin
    if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  end $$;`);

const { rows } = await db.query("select version() as version, current_setting('data_directory') as dir");

const server = new PGLiteSocketServer({ db, host: HOST, port: PORT });
await server.start();

console.log(`Local development database ready on ${HOST}:${PORT}`);
console.log(`  ${rows[0].version.split(" on ")[0]} | data folder ${rows[0].dir} | stored in ${dataDir}`);
console.log("  Press Ctrl+C to stop.");

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
