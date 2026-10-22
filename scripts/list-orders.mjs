// Prints the latest orders from the order database.
// Usage: npm run orders            (last 20 orders)
//        npm run orders -- 50      (last 50 orders)

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.HARVO_DB_PATH ?? path.join(process.cwd(), "data", "harvo.db");
if (!fs.existsSync(dbPath)) {
  console.log("No orders yet: the database is created when the first order is placed.");
  process.exit(0);
}

const limit = Math.max(1, Math.min(500, Number(process.argv[2]) || 20));
const db = new Database(dbPath, { readonly: true });

const orders = db
  .prepare(
    `SELECT id, order_number, status, customer_name, phone, city, address, notes, total, created_at
     FROM orders ORDER BY id DESC LIMIT ?`,
  )
  .all(limit);
const itemsFor = db.prepare(
  "SELECT product_name, grams, qty, line_total FROM order_items WHERE order_id = ? ORDER BY id",
);

if (orders.length === 0) console.log("No orders yet.");

for (const o of orders) {
  console.log(`\n${o.order_number}  [${o.status}]  ${o.created_at} UTC`);
  console.log(`  ${o.customer_name} · ${o.phone}`);
  console.log(`  ${o.address}, ${o.city}`);
  if (o.notes) console.log(`  Notes: ${o.notes}`);
  for (const i of itemsFor.all(o.id)) {
    console.log(`    - ${i.product_name} ${i.grams}g × ${i.qty}  Rs. ${i.line_total.toLocaleString("en-US")}`);
  }
  console.log(`  Total (COD): Rs. ${o.total.toLocaleString("en-US")}`);
}

db.close();
