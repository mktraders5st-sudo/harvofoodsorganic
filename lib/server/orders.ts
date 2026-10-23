// Server-only: turns a validated order into database rows.
// Prices and stock always come from the database, never from the browser.

import { randomBytes } from "node:crypto";
import { PAYMENT_METHOD, type ValidOrder } from "../checkout-schema";
import { formatGrams } from "../data";
import { totalsFor } from "../pricing";
import { getDb } from "./db";

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

type VariantForSale = { name: string; price: number; stock: number };

function findExisting(idempotencyKey: string): PlacedOrder | undefined {
  return getDb()
    .prepare(
      `SELECT o.order_number AS orderNumber, o.subtotal, o.delivery_fee AS delivery, o.total,
              (SELECT COALESCE(SUM(qty), 0) FROM order_items WHERE order_id = o.id) AS itemCount
       FROM orders o WHERE o.idempotency_key = ?`,
    )
    .get(idempotencyKey) as PlacedOrder | undefined;
}

export function createOrder(order: ValidOrder): PlacedOrder {
  // Same checkout submitted twice (double-click, retry): return the first order.
  const existing = findExisting(order.idempotencyKey);
  if (existing) return existing;

  const db = getDb();
  const { customer } = order;

  // Merge duplicate lines for the same product and size.
  const merged = new Map<string, { id: string; grams: number; qty: number }>();
  for (const item of order.items) {
    const key = `${item.id}-${item.grams}`;
    merged.set(key, { ...item, qty: Math.min(99, (merged.get(key)?.qty ?? 0) + item.qty) });
  }

  const findVariant = db.prepare(
    `SELECT p.name, v.price, v.stock
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.product_id = ? AND v.grams = ? AND v.active = 1 AND p.active = 1`,
  );
  const takeStock = db.prepare(
    "UPDATE product_variants SET stock = stock - ? WHERE product_id = ? AND grams = ? AND stock >= ?",
  );
  const insertOrder = db.prepare(
    `INSERT INTO orders (order_number, idempotency_key, customer_name, phone, email, city, address, notes,
                         payment_method, subtotal, delivery_fee, total)
     VALUES (@orderNumber, @idempotencyKey, @name, @phone, @email, @city, @address, @notes,
             @paymentMethod, @subtotal, @delivery, @total)`,
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, grams, unit_price, qty, line_total)
     VALUES (@orderId, @productId, @productName, @grams, @unitPrice, @qty, @lineTotal)`,
  );
  const insertHistory = db.prepare(
    "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by) VALUES (?, NULL, 'pending', 'customer')",
  );

  // Everything below runs as one transaction: if any item is unavailable, nothing is saved.
  const save = db.transaction((orderNumber: string): PlacedOrder => {
    const lines = [...merged.values()].map((item) => {
      const v = findVariant.get(item.id, item.grams) as VariantForSale | undefined;
      if (!v) {
        throw new OrderError("Some items in your cart are no longer available. Please review your cart.");
      }
      if (v.stock < item.qty) {
        throw new OrderError(
          v.stock === 0
            ? `${v.name} (${formatGrams(item.grams)}) is out of stock. Please remove it from your cart.`
            : `Only ${v.stock} of ${v.name} (${formatGrams(item.grams)}) left. Please reduce the quantity.`,
        );
      }
      return {
        productId: item.id,
        productName: v.name,
        grams: item.grams,
        unitPrice: v.price,
        qty: item.qty,
        lineTotal: v.price * item.qty,
      };
    });

    const { subtotal, delivery, total } = totalsFor(lines.reduce((sum, l) => sum + l.lineTotal, 0));

    const result = insertOrder.run({
      orderNumber,
      idempotencyKey: order.idempotencyKey,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      city: customer.city,
      address: customer.address,
      notes: customer.notes ?? null,
      paymentMethod: PAYMENT_METHOD,
      subtotal,
      delivery,
      total,
    });
    for (const line of lines) {
      insertItem.run({ orderId: result.lastInsertRowid, ...line });
      takeStock.run(line.qty, line.productId, line.grams, line.qty);
    }
    insertHistory.run(result.lastInsertRowid);

    return { orderNumber, subtotal, delivery, total, itemCount: lines.reduce((n, l) => n + l.qty, 0) };
  });

  // Retry with a fresh number in the very unlikely case of a clash.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return save(newOrderNumber());
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("orders.order_number")) continue;
      if (message.includes("orders.idempotency_key")) {
        const saved = findExisting(order.idempotencyKey); // saved by a parallel request
        if (saved) return saved;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique order number");
}
