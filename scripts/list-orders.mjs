// Prints the latest orders.
// Usage: npm run orders                 (last 20, development database)
//        npm run orders -- 50           (last 50)
//        npm run orders -- --prod --confirm=<project-id>   (LIVE database)

import { openTarget } from "./db-env.mjs";

const limit = Math.max(1, Math.min(500, Number(process.argv.slice(2).find((a) => /^\d+$/.test(a))) || 20));
const { sql, label, redact } = openTarget();

try {
  console.log(label);
  const orders = await sql`
    select id, order_number, status, customer_name, phone, city, address, notes, total, created_at
    from orders order by id desc limit ${limit}`;
  if (!orders.length) console.log("No orders yet.");

  for (const o of orders) {
    const when = o.created_at.toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
    console.log(`\n${o.order_number}  [${o.status}]  ${when}`);
    console.log(`  ${o.customer_name} · ${o.phone}`);
    console.log(`  ${o.address}, ${o.city}`);
    if (o.notes) console.log(`  Notes: ${o.notes}`);
    const items = await sql`select product_name, grams, qty, line_total from order_items where order_id = ${o.id} order by id`;
    for (const i of items) console.log(`    - ${i.product_name} ${i.grams}g × ${i.qty}  Rs. ${i.line_total.toLocaleString("en-US")}`);
    console.log(`  Total (COD): Rs. ${o.total.toLocaleString("en-US")}`);
  }
} catch (err) {
  console.error(`Failed: ${redact(err.message)}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
