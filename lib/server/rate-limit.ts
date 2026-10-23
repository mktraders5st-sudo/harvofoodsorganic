// Server-only: attempt limits stored in the database, so they hold across all server
// instances (on Vercel every instance has its own memory, so in-memory counts don't work).

import { db } from "./db";

/** Counts one attempt for `key`; returns false once `limit` attempts happen within `windowMs`. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  // One atomic statement: start a fresh window if the old one has expired, otherwise add 1.
  const [row] = await db()<{ count: number }[]>`
    insert into rate_limits (key, count, reset_at)
    values (${key}, 1, now() + ${windowMs} * interval '1 millisecond')
    on conflict (key) do update set
      count    = case when rate_limits.reset_at <= now() then 1 else rate_limits.count + 1 end,
      reset_at = case when rate_limits.reset_at <= now() then excluded.reset_at else rate_limits.reset_at end
    returning count`;
  return row.count <= limit;
}
