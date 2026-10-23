// Server-only: turns a validated order into database rows.
// Prices and stock always come from the database, never from the browser.

import { randomBytes } from "node:crypto";
import { PAYMENT_METHOD, type ValidOrder } from "../checkout-schema";
import { formatGrams } from "../data";
import { totalsFor } from "../pricing";
import { db, isUniqueViolation } from "./db";

export type PlacedOrder = {
  orderNumber: string;
  subtotal: number;
  delivery: number;
  total: number;
  itemCount: number;
};

/** A problem the customer can fix (shown to them as-is). */
export class OrderError extends Error {}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I mix-ups

/** e.g. HRV-261023-7KQ4 */
function newOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const code = Array.from(randomBytes(4), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
  return `HRV-${date}-${code}`;
}

async function findExisting(idempotencyKey: string): Promise<PlacedOrder | undefined> {
  const [row] = await db()<PlacedOrder[]>`
    select o.order_number as "orderNumber", o.subtotal, o.delivery_fee as delivery, o.total,
           (select coalesce(sum(qty), 0)::int from order_items where order_id = o.id) as "itemCount"
    from orders o where o.idempotency_key = ${idempotencyKey}`;
  return row;
}

type ForSale = { name: string; price: number; stock: number };

export async function createOrder(order: ValidOrder): Promise<PlacedOrder> {
  // Same checkout submitted twice (double-click, retry): return the first order.
  const existing = await findExisting(order.idempotencyKey);
  if (existing) return existing;

  // Merge duplicate lines for the same product and size.
  const merged = new Map<string, { id: string; grams: number; qty: number }>();
  for (const item of order.items) {
    const key = `${item.id}-${item.grams}`;
    merged.set(key, { ...item, qty: Math.min(99, (merged.get(key)?.qty ?? 0) + item.qty) });
  }
  const { customer } = order;

  // Everything below runs as one transaction: if any item is unavailable, nothing is saved.
  const save = (orderNumber: string) =>
    db().begin(async (sql): Promise<PlacedOrder> => {
      const lines = [];
      for (const item of merged.values()) {
        // Take the stock only if enough is left; the row lock stops two orders taking the same packs.
        const [taken] = await sql<ForSale[]>`
          update product_variants v set stock = v.stock - ${item.qty}
          from products p
          where p.id = v.product_id and v.product_id = ${item.id} and v.grams = ${item.grams}
            and v.active and p.active and v.stock >= ${item.qty}
          returning p.name, v.price, v.stock`;

        if (!taken) {
          const [v] = await sql<ForSale[]>`
            select p.name, v.price, v.stock from product_variants v join products p on p.id = v.product_id
            where v.product_id = ${item.id} and v.grams = ${item.grams} and v.active and p.active`;
          if (!v) throw new OrderError("Some items in your cart are no longer available. Please review your cart.");
          throw new OrderError(
            v.stock === 0
              ? `${v.name} (${formatGrams(item.grams)}) is out of stock. Please remove it from your cart.`
              : `Only ${v.stock} of ${v.name} (${formatGrams(item.grams)}) left. Please reduce the quantity.`,
          );
        }
        lines.push({
          productId: item.id,
          productName: taken.name,
          grams: item.grams,
          unitPrice: taken.price,
          qty: item.qty,
          lineTotal: taken.price * item.qty,
        });
      }

      const { subtotal, delivery, total } = totalsFor(lines.reduce((sum, l) => sum + l.lineTotal, 0));

      const [{ id }] = await sql<{ id: number }[]>`
        insert into orders (order_number, idempotency_key, customer_name, phone, email, city, address, notes,
                            payment_method, subtotal, delivery_fee, total)
        values (${orderNumber}, ${order.idempotencyKey}, ${customer.name}, ${customer.phone}, ${customer.email ?? null},
                ${customer.city}, ${customer.address}, ${customer.notes ?? null}, ${PAYMENT_METHOD},
                ${subtotal}, ${delivery}, ${total})
        returning id`;
      for (const l of lines) {
        await sql`
          insert into order_items (order_id, product_id, product_name, grams, unit_price, qty, line_total)
          values (${id}, ${l.productId}, ${l.productName}, ${l.grams}, ${l.unitPrice}, ${l.qty}, ${l.lineTotal})`;
      }
      await sql`
        insert into order_status_history (order_id, from_status, to_status, changed_by)
        values (${id}, null, 'pending', 'customer')`;

      return { orderNumber, subtotal, delivery, total, itemCount: lines.reduce((n, l) => n + l.qty, 0) };
    });

  // Retry with a fresh number in the very unlikely case of a clash.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await save(newOrderNumber());
    } catch (err) {
      if (isUniqueViolation(err, "orders_order_number_key")) continue;
      if (isUniqueViolation(err, "orders_idempotency_key_key")) {
        const saved = await findExisting(order.idempotencyKey); // saved by a parallel request
        if (saved) return saved;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique order number");
}
