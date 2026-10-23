import Link from "next/link";
import type { OrderSummary } from "@/lib/server/admin-orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function OrdersTable({ orders, empty = "No orders yet." }: { orders: OrderSummary[]; empty?: string }) {
  if (orders.length === 0) {
    return <p className="rounded-xl border border-dashed border-cream-300 bg-white p-8 text-center text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-cream-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">City</th>
            <th className="px-4 py-3 text-right font-semibold">Items</th>
            <th className="px-4 py-3 text-right font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {orders.map((o) => (
            <tr key={o.orderNumber} className="hover:bg-forest-50/60">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-forest-700 hover:underline">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
              <td className="px-4 py-3">
                <span className="block font-medium text-ink">{o.customerName}</span>
                <span className="block text-xs text-muted">{o.phone}</span>
              </td>
              <td className="px-4 py-3">{o.city}</td>
              <td className="px-4 py-3 text-right">{o.itemCount}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.total)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
