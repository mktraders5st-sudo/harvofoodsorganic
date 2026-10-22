// Server-only: opens the SQLite order database and creates its tables.
// Never import this file from a "use client" component.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.HARVO_DB_PATH ?? path.join(process.cwd(), "data", "harvo.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number     TEXT    NOT NULL UNIQUE,
    idempotency_key  TEXT    NOT NULL UNIQUE,
    status           TEXT    NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
    customer_name    TEXT    NOT NULL,
    phone            TEXT    NOT NULL,
    email            TEXT,
    city             TEXT    NOT NULL,
    address          TEXT    NOT NULL,
    notes            TEXT,
    payment_method   TEXT    NOT NULL DEFAULT 'COD' CHECK (payment_method = 'COD'),
    subtotal         INTEGER NOT NULL CHECK (subtotal >= 0),
    delivery_fee     INTEGER NOT NULL CHECK (delivery_fee >= 0),
    total            INTEGER NOT NULL CHECK (total >= 0),
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    TEXT    NOT NULL,
    product_name  TEXT    NOT NULL,
    grams         INTEGER NOT NULL CHECK (grams IN (50, 100, 250)),
    unit_price    INTEGER NOT NULL CHECK (unit_price >= 0),
    qty           INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 99),
    line_total    INTEGER NOT NULL CHECK (line_total >= 0)
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
`;

function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { harvoDb?: Database.Database };

export function getDb() {
  globalForDb.harvoDb ??= open();
  return globalForDb.harvoDb;
}
