// Server-only: admin access checks.
//
// Two simple rules:
// 1. On your own computer (`npm run dev`, opened as localhost) the admin panel needs no login.
//    This only works in development mode, for localhost addresses, and the dev server only
//    listens to this computer (see the "dev" script in package.json).
// 2. Everywhere else (the live website) one admin password protects the panel. It is set with
//    the ADMIN_PASSWORD environment variable (12+ characters). If it isn't set, admin stays locked.
//
// Every admin page AND every admin action calls requireAdmin(), which applies these rules on the server.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const SESSION_COOKIE = "harvo_admin";
const SESSION_HOURS = 8;
const MIN_PASSWORD_LENGTH = 12;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

export type Admin = {
  /** Shown in the panel and saved in order history. */
  name: string;
  /** True when signed in automatically on this computer (development, localhost). */
  local: boolean;
};

/* ---------- Local development ---------- */

/** Password-free access: development mode AND the site is opened as localhost. */
async function isLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") return false;
  const host = (await headers()).get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
  return LOCAL_HOSTS.includes(hostname);
}

/* ---------- Live website: one admin password ---------- */

function adminPassword() {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return pw.length >= MIN_PASSWORD_LENGTH ? pw : null;
}

/** False on a live server where ADMIN_PASSWORD hasn't been set (admin is then locked). */
export function isAdminPasswordConfigured() {
  return adminPassword() !== null;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/** Signing key derived from the password, so changing the password signs everyone out. */
function signingKey(password: string) {
  return sha256(`harvo-admin-session-v1:${password}`);
}

function sign(payload: string, password: string) {
  return createHmac("sha256", signingKey(password)).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = sha256(a), y = sha256(b); // equal-length buffers for a constant-time comparison
  return timingSafeEqual(x, y);
}

/** Cookie value: "<expiry-ms>.<signature>". Nothing secret is stored in it. */
function verifySession(token: string | undefined, password: string) {
  if (!token || token.length > 200) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature || !/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  return safeEqual(signature, sign(expiry, password));
}

/* ---------- Access checks ---------- */

/** The admin for this request, or null. Cached per request. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (await isLocalDevelopment()) return { name: "local admin", local: true };

  const password = adminPassword();
  if (!password) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, password) ? { name: "admin", local: false } : null;
});

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/* ---------- Login / logout (live website) ---------- */

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(attempt: string): Promise<LoginResult> {
  const password = adminPassword();
  if (!password) return { ok: false, error: "Admin access isn't set up on this server yet." };
  if (!safeEqual(attempt, password)) return { ok: false, error: "Incorrect password." };

  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  const expiry = String(expires.getTime());
  (await cookies()).set(SESSION_COOKIE, `${expiry}.${sign(expiry, password)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}
