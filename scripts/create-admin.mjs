// Creates an admin account, or sets a new password for an existing one.
// Usage:  npm run admin:create -- <username>
// The password is typed in hidden and stored only as a scrypt hash.

import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const username = (process.argv[2] ?? "").trim();
if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
  console.error("Usage: npm run admin:create -- <username>");
  console.error("Username: 3-50 letters, numbers, dots, dashes or underscores.");
  process.exit(1);
}

/** Reads a line from the terminal without showing what is typed. */
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    if (!stdin.isTTY) {
      console.error("\nRun this in an interactive terminal so the password can be typed hidden.");
      process.exit(1);
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let input = "";
    // A pasted password arrives as one chunk, so handle it character by character.
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(input);
          return;
        } else if (ch === "\u0003") {
          stdout.write("\n");
          process.exit(130);
        } else if (ch === "\u007f" || ch === "\b") {
          input = input.slice(0, -1);
        } else {
          input += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

// Same format as lib/server/auth.ts: scrypt$N$r$p$salt$hash
function hashPassword(password) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

// Same migration runner as lib/server/db.ts, so this works before the site has ever started.
function openDb() {
  const dbPath = process.env.HARVO_DB_PATH ?? path.join(process.cwd(), "data", "harvo.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const dir = path.join(process.cwd(), "db", "migrations");
  const current = db.pragma("user_version", { simple: true });
  for (const file of fs.readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort()) {
    const version = Number(file.slice(0, 3));
    if (version <= current) continue;
    db.transaction(() => {
      db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
      db.pragma(`user_version = ${version}`);
    })();
  }
  return db;
}

const password = await askHidden(`New password for "${username}": `);
if (password.length < 12) {
  console.error("Password must be at least 12 characters. Nothing was changed.");
  process.exit(1);
}
if ((await askHidden("Type it again: ")) !== password) {
  console.error("Passwords don't match. Nothing was changed.");
  process.exit(1);
}

const db = openDb();
const hash = hashPassword(password);
const existing = db.prepare("SELECT id FROM admin_users WHERE username = ?").get(username);

if (existing) {
  db.transaction(() => {
    db.prepare("UPDATE admin_users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?").run(hash, existing.id);
    db.prepare("DELETE FROM admin_sessions WHERE user_id = ?").run(existing.id); // sign out everywhere
  })();
  console.log(`Password updated for "${username}". Existing sessions were signed out.`);
} else {
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run(username, hash);
  console.log(`Admin "${username}" created. Sign in at /admin/login`);
}
db.close();
