// Server-only: turns a validated order into database rows.
// Prices are always taken from the catalogue here, never from the browser.

import { randomBytes } from "node:crypto";
import { PAYMENT_METHOD, type ValidOrder } from "../checkout-schema";
import { getProduct } from "../data";
import { totalsFor } from "../pricing";
import { getDb } from "./db";

export type PlacedOrder = {
  orderNumber: string;
  subtotal: number;
  delivery: number;
  total: number;
  itemCount: number;
};

export class OrderError extends Error {}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I mix-ups

/** e.g. HRV-261023-7KQ4 */
function newOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const bytes = randomBytes(4);
  const code = Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
  return `HRV-${date}-${code}`;
}

/** Looks up real prices and merges duplicate lines. */
function priceItems(items: ValidOrder["items"]) {
  const merged = new Map<string, { id: string; grams: 50 | 100 | 250; qty: number }>();
  for (const item of items) {
    const key = `${item.id}-${item.grams}`;
    const existing = merged.get(key);
    merged.set(key, { ...item, qty: Math.min(99, (existing?.qty ?? 0) + item.qty) });
  }

  return [...merged.values()].map((item) => {
    const product = getProduct(item.id);
    if (!product) throw new OrderError("Some items in your cart are no longer available. Please review your cart.");
    const unitPrice = product.prices[item.grams];
    return {
      productId: product.id,
      productName: product.name,
      grams: item.grams,
      unitPrice,
      qty: item.qty,
      lineTotal: unitPrice * item.qty,
    };
  });
}

export function createOrder(order: ValidOrder): PlacedOrder {
  const db = getDb();

  // Same checkout submitted twice (double-click, retry): return the first order.
  const existing = db
    .prepare(
      `SELECT o.order_number AS orderNumber, o.subtotal, o.delivery_fee AS delivery, o.total,
              (SELECT COALESCE(SUM(qty), 0) FROM order_items WHERE order_id = o.id) AS itemCount
       FROM orders o WHERE o.idempotency_key = ?`,
    )
    .get(order.idempotencyKey) as PlacedOrder | undefined;
  if (existing) return existing;

  const lines = priceItems(order.items);
  const { subtotal, delivery, total } = totalsFor(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const { customer } = order;

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

  const save = db.transaction((orderNumber: string) => {
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
    for (const line of lines) insertItem.run({ orderId: result.lastInsertRowid, ...line });
  });

  // Retry with a fresh number in the very unlikely case of a clash.
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = newOrderNumber();
    try {
      save(orderNumber);
      return { orderNumber, subtotal, delivery, total, itemCount: lines.reduce((n, l) => n + l.qty, 0) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("orders.order_number")) continue;
      if (message.includes("orders.idempotency_key")) return createOrder(order); // saved by a parallel request
      throw err;
    }
  }
  throw new Error("Could not generate a unique order number");
}
