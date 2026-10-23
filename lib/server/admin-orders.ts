// Server-only: order queries and updates for the admin panel.
// Callers must check admin access (requireAdmin) first.

import { getDb } from "./db";

export const ORDER_STATUSES = ["pending", "confirmed", "dispatched", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Which statuses an order can move to next. Delivered and cancelled are final. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  id: number;
  email: string | null;
  address: string;
  notes: string | null;
  paymentMethod: "COD";
  subtotal: number;
  deliveryFee: number;
  updatedAt: string;
  items: { productId: string; productName: string; grams: number; unitPrice: number; qty: number; lineTotal: number }[];
  history: { fromStatus: OrderStatus | null; toStatus: OrderStatus; changedBy: string; changedAt: string }[];
};

const SUMMARY_COLUMNS = `
  o.order_number AS orderNumber, o.status, o.customer_name AS customerName, o.phone, o.city, o.total,
  o.created_at AS createdAt,
  (SELECT COALESCE(SUM(qty), 0) FROM order_items WHERE order_id = o.id) AS itemCount`;

export const PAGE_SIZE = 25;

export function listOrders({ status, q, page = 1 }: { status?: OrderStatus; q?: string; page?: number }) {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (status) {
    where.push("o.status = @status");
    params.status = status;
  }
  const search = q?.trim();
  if (search) {
    // Matches order number, customer name, or phone (digits only, so "0300-123" finds "0300123…").
    where.push("(o.order_number LIKE @like OR o.customer_name LIKE @like OR o.phone LIKE @digits)");
    params.like = `%${search}%`;
    params.digits = `%${search.replace(/\D/g, "") || search}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const db = getDb();
  const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`);
  const { total } = (where.length ? countStmt.get(params) : countStmt.get()) as { total: number };
  const orders = db
    .prepare(
      `SELECT ${SUMMARY_COLUMNS} FROM orders o ${whereSql}
       ORDER BY o.id DESC LIMIT ${PAGE_SIZE} OFFSET @offset`,
    )
    .all({ ...params, offset: (Math.max(1, page) - 1) * PAGE_SIZE }) as OrderSummary[];

  return { orders, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getOrder(orderNumber: string): OrderDetail | undefined {
  const db = getDb();
  const order = db
    .prepare(
      `SELECT o.id, ${SUMMARY_COLUMNS}, o.email, o.address, o.notes, o.payment_method AS paymentMethod,
              o.subtotal, o.delivery_fee AS deliveryFee, o.updated_at AS updatedAt
       FROM orders o WHERE o.order_number = ?`,
    )
    .get(orderNumber) as Omit<OrderDetail, "items" | "history"> | undefined;
  if (!order) return undefined;

  const items = db
    .prepare(
      `SELECT product_id AS productId, product_name AS productName, grams, unit_price AS unitPrice, qty,
              line_total AS lineTotal
       FROM order_items WHERE order_id = ? ORDER BY id`,
    )
    .all(order.id) as OrderDetail["items"];
  const history = db
    .prepare(
      `SELECT from_status AS fromStatus, to_status AS toStatus, changed_by AS changedBy, changed_at AS changedAt
       FROM order_status_history WHERE order_id = ? ORDER BY id`,
    )
    .all(order.id) as OrderDetail["history"];

  return { ...order, items, history };
}

/** Other orders from the same phone number, newest first. */
export function ordersByPhone(phone: string, excludeOrderNumber: string) {
  return getDb()
    .prepare(
      `SELECT ${SUMMARY_COLUMNS} FROM orders o
       WHERE o.phone = ? AND o.order_number != ? ORDER BY o.id DESC LIMIT 20`,
    )
    .all(phone, excludeOrderNumber) as OrderSummary[];
}

export class StatusError extends Error {}

/** Moves an order to a new status. Cancelling returns its items to stock. */
export function setOrderStatus(orderNumber: string, to: OrderStatus, changedBy: string) {
  const db = getDb();
  db.transaction(() => {
    const order = db.prepare("SELECT id, status FROM orders WHERE order_number = ?").get(orderNumber) as
      | { id: number; status: OrderStatus }
      | undefined;
    if (!order) throw new StatusError("Order not found.");
    if (!NEXT_STATUSES[order.status].includes(to)) {
      throw new StatusError(`An order that is ${order.status} can't be changed to ${to}.`);
    }

    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(to, order.id);
    db.prepare(
      "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?)",
    ).run(order.id, order.status, to, changedBy);

    if (to === "cancelled") {
      db.prepare(
        `UPDATE product_variants SET stock = stock + (
           SELECT SUM(i.qty) FROM order_items i
           WHERE i.order_id = @orderId AND i.product_id = product_variants.product_id AND i.grams = product_variants.grams)
         WHERE EXISTS (
           SELECT 1 FROM order_items i
           WHERE i.order_id = @orderId AND i.product_id = product_variants.product_id AND i.grams = product_variants.grams)`,
      ).run({ orderId: order.id });
    }
  })();
}

export function dashboardStats() {
  const db = getDb();
  const one = <T>(sql: string) => db.prepare(sql).get() as T;
  return {
    pending: one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'").n,
    toDispatch: one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE status = 'confirmed'").n,
    // Pakistan time is UTC+5: count "today" in Karachi, not UTC.
    today: one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM orders WHERE date(created_at, '+5 hours') = date('now', '+5 hours')",
    ).n,
    monthSales: one<{ s: number }>(
      `SELECT COALESCE(SUM(total), 0) AS s FROM orders
       WHERE status != 'cancelled' AND strftime('%Y-%m', created_at, '+5 hours') = strftime('%Y-%m', 'now', '+5 hours')`,
    ).s,
  };
}
