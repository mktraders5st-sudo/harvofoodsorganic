// Copies products, sizes and orders from the old SQLite database into Supabase.
// The SQLite file is opened READ-ONLY and never changed. Nothing in Supabase is deleted or
// overwritten: rows that already exist (same id) are skipped. Everything runs in one transaction.
//
//   npm run db:import                          dry run against the development database
//   npm run db:import -- --apply               copy into the development database
//   npm run db:import -- --prod --apply --confirm=<project-id>   copy into the LIVE database
//   add --sqlite=path/to/file.db to read a different SQLite file (default: data/harvo.db)

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { openTarget } from "./db-env.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const sqlitePath = path.resolve(args.find((a) => a.startsWith("--sqlite="))?.slice(9) ?? "data/harvo.db");

if (!fs.existsSync(sqlitePath)) { console.error(`SQLite file not found: ${sqlitePath}`); process.exit(1); }
let Database;
try { Database = createRequire(import.meta.url)("better-sqlite3"); }
catch { console.error("The SQLite reader (better-sqlite3) isn't installed. Run: npm install"); process.exit(1); }

const lite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
const { sql, label, redact } = openTarget(args);

// SQLite stored UTC times as "YYYY-MM-DD HH:MM:SS".
const ts = (s) => (s ? new Date(`${s.replace(" ", "T")}Z`) : new Date());
const bool = (n) => n === 1;

const source = {
  products: lite.prepare("SELECT * FROM products ORDER BY sort_order, id").all(),
  variants: lite.prepare("SELECT * FROM product_variants ORDER BY id").all(),
  orders: lite.prepare("SELECT * FROM orders ORDER BY id").all(),
  items: lite.prepare("SELECT * FROM order_items ORDER BY id").all(),
  history: lite.prepare("SELECT * FROM order_status_history ORDER BY id").all(),
};
const images = source.products.filter((p) => p.image);

try {
  console.log(`\nFrom: ${sqlitePath} (read-only, integrity ${lite.pragma("integrity_check", { simple: true })})`);
  console.log(`To:   ${label}\n`);

  const tables = (await sql`select table_name from information_schema.tables where table_schema = 'public'`).map((r) => r.table_name);
  const missing = ["categories", "products", "product_variants", "product_images", "orders", "order_items", "order_status_history"].filter((t) => !tables.includes(t));
  if (missing.length) throw new Error(`Tables missing in Supabase: ${missing.join(", ")}. Run npm run db:migrate first.`);

  // What already exists in Supabase (by id), so the dry run can say exactly what would be added.
  const have = {
    products: new Set((await sql`select id from products`).map((r) => r.id)),
    variants: new Set((await sql`select id from product_variants`).map((r) => r.id)),
    images: new Set((await sql`select product_id from product_images where sort_order = 0`).map((r) => r.product_id)),
    orders: new Set((await sql`select id from orders`).map((r) => r.id)),
    items: new Set((await sql`select id from order_items`).map((r) => r.id)),
    history: new Set((await sql`select id from order_status_history`).map((r) => r.id)),
  };
  const plan = [
    ["products", source.products, (r) => have.products.has(r.id)],
    ["product sizes", source.variants, (r) => have.variants.has(r.id)],
    ["product photos", images, (r) => have.images.has(r.id)],
    ["orders", source.orders, (r) => have.orders.has(r.id)],
    ["order items", source.items, (r) => have.items.has(r.id)],
    ["order history", source.history, (r) => have.history.has(r.id)],
  ];
  console.log("table            in SQLite   already in Supabase   would add");
  for (const [name, rows, exists] of plan) {
    const skip = rows.filter(exists).length;
    console.log(`${name.padEnd(16)} ${String(rows.length).padStart(9)}   ${String(skip).padStart(19)}   ${String(rows.length - skip).padStart(9)}`);
  }

  if (!apply) {
    console.log("\nDry run only: nothing was written. Add --apply to copy.");
  } else {
    await sql.begin(async (tx) => {
      for (const p of source.products) {
        await tx`insert into products (id, category_id, name, description, color, rim, rating, reviews, badge,
                   featured, active, sort_order, created_at, updated_at)
                 values (${p.id}, ${p.category}, ${p.name}, ${p.description}, ${p.color}, ${p.rim}, ${p.rating},
                   ${p.reviews}, ${p.badge}, ${bool(p.featured)}, ${bool(p.active)}, ${p.sort_order},
                   ${ts(p.created_at)}, ${ts(p.updated_at)})
                 on conflict (id) do nothing`;
      }
      for (const p of images) {
        await tx`insert into product_images (product_id, url, alt, sort_order) values (${p.id}, ${p.image}, ${p.name}, 0)
                 on conflict (product_id, sort_order) do nothing`;
      }
      for (const v of source.variants) {
        await tx`insert into product_variants (id, product_id, grams, price, stock, active)
                 values (${v.id}, ${v.product_id}, ${v.grams}, ${v.price}, ${v.stock}, ${bool(v.active)})
                 on conflict do nothing`;
      }
      for (const o of source.orders) {
        await tx`insert into orders (id, order_number, idempotency_key, status, customer_name, phone, email, city,
                   address, notes, payment_method, subtotal, delivery_fee, total, created_at, updated_at)
                 values (${o.id}, ${o.order_number}, ${o.idempotency_key}, ${o.status}, ${o.customer_name}, ${o.phone},
                   ${o.email}, ${o.city}, ${o.address}, ${o.notes}, ${o.payment_method}, ${o.subtotal},
                   ${o.delivery_fee}, ${o.total}, ${ts(o.created_at)}, ${ts(o.updated_at)})
                 on conflict do nothing`;
      }
      for (const i of source.items) {
        await tx`insert into order_items (id, order_id, product_id, product_name, grams, unit_price, qty, line_total)
                 values (${i.id}, ${i.order_id}, ${i.product_id}, ${i.product_name}, ${i.grams}, ${i.unit_price},
                   ${i.qty}, ${i.line_total})
                 on conflict do nothing`;
      }
      for (const h of source.history) {
        await tx`insert into order_status_history (id, order_id, from_status, to_status, changed_by, changed_at)
                 values (${h.id}, ${h.order_id}, ${h.from_status}, ${h.to_status}, ${h.changed_by}, ${ts(h.changed_at)})
                 on conflict do nothing`;
      }
      // New rows created later must get ids after the copied ones.
      for (const t of ["product_variants", "product_images", "orders", "order_items", "order_status_history"]) {
        await tx.unsafe(`select setval(pg_get_serial_sequence('${t}', 'id'), greatest((select coalesce(max(id), 0) from ${t}), 1))`);
      }
    });
    console.log("\nCopied.");
  }

  // Verify: every product and size in SQLite matches Supabase exactly.
  const pgProducts = new Map((await sql`select id, category_id, name, active, featured from products`).map((r) => [r.id, r]));
  const pgVariants = new Map((await sql`select id, product_id, grams, price, stock, active from product_variants`).map((r) => [r.id, r]));
  const mismatches = [];
  for (const p of source.products) {
    const q = pgProducts.get(p.id);
    if (!q) { if (apply) mismatches.push(`product ${p.id} missing`); continue; }
    if (q.name !== p.name || q.category_id !== p.category || q.active !== bool(p.active) || q.featured !== bool(p.featured)) mismatches.push(`product ${p.id} differs`);
  }
  for (const v of source.variants) {
    const w = pgVariants.get(v.id);
    if (!w) { if (apply) mismatches.push(`size ${v.product_id} ${v.grams}g missing`); continue; }
    if (w.product_id !== v.product_id || w.grams !== v.grams || w.price !== v.price || w.stock !== v.stock || w.active !== bool(v.active)) {
      mismatches.push(`size ${v.product_id} ${v.grams}g differs (SQLite Rs.${v.price}/stock ${v.stock}, Supabase Rs.${w.price}/stock ${w.stock})`);
    }
  }
  const compared = source.products.filter((p) => pgProducts.has(p.id)).length + source.variants.filter((v) => pgVariants.has(v.id)).length;
  console.log(`\nCheck: compared ${compared} products and sizes with SQLite: ${mismatches.length ? mismatches.length + " difference(s)" : "all match"}.`);
  for (const m of mismatches.slice(0, 20)) console.log(`  - ${m}`);
  if (mismatches.length) process.exitCode = 1;
} catch (err) {
  console.error(`\nFailed (nothing was saved): ${redact(err.message)}`);
  process.exitCode = 1;
} finally {
  lite.close();
  await sql.end({ timeout: 5 });
}
