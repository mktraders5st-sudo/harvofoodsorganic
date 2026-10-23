// Server-only: order queries and updates for the admin panel (Supabase / PostgreSQL).
// Callers must check admin access (requireAdmin) first.

import { db } from "./db";

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

/** Dashboard dates are counted in Pakistan time. */
const SHOP_TIME_ZONE = "Asia/Karachi";

export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export type OrderDetail = OrderSummary & {
  id: number;
  email: string | null;
  address: string;
  notes: string | null;
  paymentMethod: "COD";
  subtotal: number;
  deliveryFee: number;
  updatedAt: Date;
  items: { productId: string; productName: string; grams: number; unitPrice: number; qty: number; lineTotal: number }[];
  history: { fromStatus: OrderStatus | null; toStatus: OrderStatus; changedBy: string; changedAt: Date }[];
};

const SUMMARY_COLUMNS = `
  o.order_number as "orderNumber", o.status, o.customer_name as "customerName", o.phone, o.city, o.total,
  o.created_at as "createdAt",
  (select coalesce(sum(qty), 0)::int from order_items where order_id = o.id) as "itemCount"`;

export const PAGE_SIZE = 25;

export async function listOrders({ status, q, page = 1 }: { status?: OrderStatus; q?: string; page?: number }) {
  const sql = db();
  const search = q?.trim();
  // Matches order number or customer name, or phone by digits only ("0300-123" finds "0300123…").
  const like = search ? `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const digits = search ? `%${search.replace(/\D/g, "") || search}%` : null;

  const where = sql`
    where true
    ${status ? sql`and o.status = ${status}` : sql``}
    ${like ? sql`and (o.order_number ilike ${like} or o.customer_name ilike ${like} or o.phone like ${digits})` : sql``}`;

  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
  const [[{ total }], orders] = await Promise.all([
    sql<{ total: number }[]>`select count(*)::int as total from orders o ${where}`,
    sql<OrderSummary[]>`
      select ${sql.unsafe(SUMMARY_COLUMNS)} from orders o ${where}
      order by o.id desc limit ${PAGE_SIZE} offset ${offset}`,
  ]);

  return { orders, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getOrder(orderNumber: string): Promise<OrderDetail | undefined> {
  const sql = db();
  const [order] = await sql<Omit<OrderDetail, "items" | "history">[]>`
    select o.id, ${sql.unsafe(SUMMARY_COLUMNS)}, o.email, o.address, o.notes, o.payment_method as "paymentMethod",
           o.subtotal, o.delivery_fee as "deliveryFee", o.updated_at as "updatedAt"
    from orders o where o.order_number = ${orderNumber}`;
  if (!order) return undefined;

  const [items, history] = await Promise.all([
    sql<OrderDetail["items"]>`
      select product_id as "productId", product_name as "productName", grams, unit_price as "unitPrice", qty,
             line_total as "lineTotal"
      from order_items where order_id = ${order.id} order by id`,
    sql<OrderDetail["history"]>`
      select from_status as "fromStatus", to_status as "toStatus", changed_by as "changedBy", changed_at as "changedAt"
      from order_status_history where order_id = ${order.id} order by id`,
  ]);

  return { ...order, items, history };
}

/** Other orders from the same phone number, newest first. */
export async function ordersByPhone(phone: string, excludeOrderNumber: string) {
  const sql = db();
  return sql<OrderSummary[]>`
    select ${sql.unsafe(SUMMARY_COLUMNS)} from orders o
    where o.phone = ${phone} and o.order_number <> ${excludeOrderNumber}
    order by o.id desc limit 20`;
}

export class StatusError extends Error {}

/** Moves an order to a new status. Cancelling returns its items to stock. */
export async function setOrderStatus(orderNumber: string, to: OrderStatus, changedBy: string) {
  await db().begin(async (sql) => {
    // Lock the order row so two admins can't change it at the same time.
    const [order] = await sql<{ id: number; status: OrderStatus }[]>`
      select id, status from orders where order_number = ${orderNumber} for update`;
    if (!order) throw new StatusError("Order not found.");
    if (!NEXT_STATUSES[order.status].includes(to)) {
      throw new StatusError(`An order that is ${order.status} can't be changed to ${to}.`);
    }

    await sql`update orders set status = ${to}, updated_at = now() where id = ${order.id}`;
    await sql`
      insert into order_status_history (order_id, from_status, to_status, changed_by)
      values (${order.id}, ${order.status}, ${to}, ${changedBy})`;

    if (to === "cancelled") {
      await sql`
        update product_variants v set stock = v.stock + i.qty
        from (select product_id, grams, sum(qty)::int as qty from order_items where order_id = ${order.id}
              group by product_id, grams) i
        where v.product_id = i.product_id and v.grams = i.grams`;
    }
  });
}

export async function dashboardStats() {
  const [s] = await db()<{ pending: number; toDispatch: number; today: number; monthSales: number }[]>`
    select
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where status = 'confirmed')::int as "toDispatch",
      count(*) filter (where (created_at at time zone ${SHOP_TIME_ZONE})::date
                             = (now() at time zone ${SHOP_TIME_ZONE})::date)::int as today,
      coalesce(sum(total) filter (where status <> 'cancelled'
                and date_trunc('month', created_at at time zone ${SHOP_TIME_ZONE})
                  = date_trunc('month', now() at time zone ${SHOP_TIME_ZONE})), 0)::int as "monthSales"
    from orders`;
  return s;
}
