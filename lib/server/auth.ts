// Server-only: admin passwords, sessions and access checks.
//
// - Passwords are hashed with scrypt (random salt per password); plain passwords are never stored.
// - A session is a random 256-bit token in an httpOnly cookie; only its SHA-256 hash is stored.
// - Every admin page AND every admin action must call requireAdmin(): it checks the session on the server.

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { promisify } from "node:util";
import { getDb } from "./db";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = "harvo_admin";
const SESSION_HOURS = 8;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 64 };

export type Admin = { id: number; username: string };

/* ---------- Passwords ---------- */

/** Format: scrypt$N$r$p$saltBase64$hashBase64 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT.keyLen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

async function verifyPassword(password: string, stored: string) {
  const [algo, N, r, p, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the username doesn't exist, so the response takes the same time either way.
let dummyHash: Promise<string> | undefined;

/* ---------- Sessions ---------- */

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  const db = getDb();
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();
  db.prepare("INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    toSqlDate(expires),
  );

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

const toSqlDate = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

/** The signed-in admin for this request, or null. Cached per request. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(sha256(token)) as Admin | undefined;
  return row ?? null;
});

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/* ---------- Login / logout ---------- */

type UserRow = { id: number; password_hash: string; failed_attempts: number; locked_until: string | null };

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, password_hash, failed_attempts,
              CASE WHEN locked_until > datetime('now') THEN locked_until END AS locked_until
       FROM admin_users WHERE username = ?`,
    )
    .get(username) as UserRow | undefined;

  const failure: LoginResult = { ok: false, error: "Incorrect username or password." };

  if (!user) {
    dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummyHash);
    return failure;
  }

  if (user.locked_until) {
    return { ok: false, error: `Too many failed attempts. Try again after ${LOCK_MINUTES} minutes.` };
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const attempts = user.failed_attempts + 1;
    db.prepare(
      `UPDATE admin_users SET failed_attempts = ?,
              locked_until = CASE WHEN ? >= ? THEN datetime('now', '+${LOCK_MINUTES} minutes') END
       WHERE id = ?`,
    ).run(attempts >= MAX_FAILED_ATTEMPTS ? 0 : attempts, attempts, MAX_FAILED_ATTEMPTS, user.id);
    return attempts >= MAX_FAILED_ATTEMPTS
      ? { ok: false, error: `Too many failed attempts. Try again after ${LOCK_MINUTES} minutes.` }
      : failure;
  }

  db.prepare(
    "UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?",
  ).run(user.id);
  await startSession(user.id);
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(sha256(token));
  store.delete(SESSION_COOKIE);
}
