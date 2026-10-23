-- Harvo Foods Organic: initial schema.
-- Migrations run in file-name order; each runs once (tracked with PRAGMA user_version).

-- ── Catalogue ────────────────────────────────────────────
CREATE TABLE products (
  id           TEXT    PRIMARY KEY CHECK (id GLOB '[a-z0-9]*' AND length(id) <= 60),
  name         TEXT    NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  category     TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  color        TEXT    NOT NULL DEFAULT '#3f9d4c',
  rim          TEXT,
  image        TEXT,
  rating       INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 0 AND 5),
  reviews      INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  badge        TEXT    CHECK (badge IN ('Best Seller', 'New')),
  featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Package sizes: one row per product + size, each with its own price and stock.
CREATE TABLE product_variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  grams       INTEGER NOT NULL CHECK (grams BETWEEN 1 AND 100000),
  price       INTEGER NOT NULL CHECK (price BETWEEN 0 AND 10000000),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock BETWEEN 0 AND 1000000),
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  UNIQUE (product_id, grams)
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ── Orders (cash on delivery only, no payment data stored) ─
CREATE TABLE orders (
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
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_phone   ON orders(phone);

-- Items keep a snapshot of name and price, so later catalogue edits never change past orders.
CREATE TABLE order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    TEXT    NOT NULL,
  product_name  TEXT    NOT NULL,
  grams         INTEGER NOT NULL CHECK (grams > 0),
  unit_price    INTEGER NOT NULL CHECK (unit_price >= 0),
  qty           INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 99),
  line_total    INTEGER NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Audit trail: who changed an order's status, and when.
CREATE TABLE order_status_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT    NOT NULL,
  changed_by   TEXT    NOT NULL,
  changed_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_status_history_order ON order_status_history(order_id);

-- ── Admin access ─────────────────────────────────────────
CREATE TABLE admin_users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash    TEXT    NOT NULL,
  failed_attempts  INTEGER NOT NULL DEFAULT 0,
  locked_until     TEXT,
  last_login_at    TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Only a SHA-256 hash of each session token is stored; the token itself lives in the admin's cookie.
CREATE TABLE admin_sessions (
  token_hash  TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_expires ON admin_sessions(expires_at);
