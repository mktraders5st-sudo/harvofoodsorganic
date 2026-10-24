// Server-only: the PostgreSQL (Supabase) connection.
// Never import this file from a "use client" component. The connection string comes from the
// DATABASE_URL environment variable and is never sent to the browser or logged.

import postgres from "postgres";

export type Sql = postgres.Sql;

/** Database hosts on this computer (local development). Everything else, including Supabase, is remote. */
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

function connect(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");

  let host: string;
  try {
    host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  } catch {
    // Don't include the address in the error: it contains the password.
    throw new Error("DATABASE_URL is not a valid address.");
  }
  const isLocal = LOCAL_HOSTS.includes(host);

  return postgres(url, {
    // Remote databases (Supabase) always require an encrypted connection.
    // A PostgreSQL running on this computer has no encryption, so it's off only for that.
    ssl: isLocal ? false : "require",
    // Supabase's transaction pooler (port 6543) doesn't support prepared statements.
    prepare: false,
    // The local development database (PGlite) handles one query at a time.
    // Elsewhere keep the pool small: on Vercel each server instance opens its own connections.
    max: isLocal ? 1 : process.env.NODE_ENV === "production" ? 3 : 5,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  });
}

// One pool per server process (reused across hot reloads in development).
const globalForDb = globalThis as unknown as { harvoSql?: Sql };

/** The shared connection pool, created on first use so builds don't need a database. */
export function db(): Sql {
  globalForDb.harvoSql ??= connect();
  return globalForDb.harvoSql;
}

/** True for a unique-constraint violation on the named constraint (Postgres error 23505). */
export function isUniqueViolation(err: unknown, constraint?: string) {
  const e = err as { code?: string; constraint_name?: string };
  return e?.code === "23505" && (!constraint || e.constraint_name === constraint);
}
