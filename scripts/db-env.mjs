// Shared by the db:* scripts: picks the database and opens a connection.
//
//   (default)  development database: DATABASE_URL from .env.local
//   --prod     LIVE database: DATABASE_URL from .env.production.local, and the command must
//              also include --confirm=<project-id> so the live database is never used by accident.
//
// The connection string is never printed; only the project id and host are shown.

import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

/** The live Supabase project. Development commands refuse to run against it. */
const LIVE_PROJECT_ID = "wrwiuvdijwuvwwygkkyf";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

export function openTarget(argv = process.argv.slice(2)) {
  const prod = argv.includes("--prod");
  const envFile = path.join(process.cwd(), prod ? ".env.production.local" : ".env.local");
  if (!fs.existsSync(envFile)) {
    console.error(`Missing ${path.basename(envFile)}. ${prod ? "Save the LIVE DATABASE_URL there." : "Save the development DATABASE_URL there."}`);
    process.exit(1);
  }
  delete process.env.DATABASE_URL;
  process.loadEnvFile(envFile);
  const url = process.env.DATABASE_URL;
  if (!url) { console.error(`DATABASE_URL is not set in ${path.basename(envFile)}.`); process.exit(1); }

  let u;
  try { u = new URL(url); } catch { console.error(`DATABASE_URL in ${path.basename(envFile)} is not a valid address.`); process.exit(1); }
  const isLocal = LOCAL_HOSTS.includes(u.hostname.replace(/^\[|\]$/g, ""));
  if (prod && isLocal) {
    console.error("--prod must point at the live Supabase database, not this computer.");
    process.exit(1);
  }
  if (!prod && u.username === `postgres.${LIVE_PROJECT_ID}`) {
    console.error("STOP: .env.local points at the LIVE project. Development must use a separate database.");
    process.exit(1);
  }
  const project = u.username.split(".")[1] ?? "(unknown)";
  const label = isLocal
    ? `local development database: ${u.hostname}:${u.port}${u.pathname} (this computer only)`
    : `${prod ? "LIVE" : "development"} database: project ${project} (${u.hostname})`;

  if (prod && !argv.includes(`--confirm=${project}`)) {
    console.error(`\nThis would use the ${label}.`);
    console.error(`To continue, run the same command again with:  --confirm=${project}\n`);
    process.exit(1);
  }

  const secrets = [url, u.password, decodeURIComponent(u.password)].filter((s) => s && s.length > 3);
  const redact = (text) => secrets.reduce((t, s) => t.split(s).join("[REDACTED]"), String(text));
  const sql = postgres(url, { ssl: isLocal ? false : "require", prepare: false, max: 1, connect_timeout: 20, onnotice: () => {} });
  return { sql, label, prod, redact };
}
