import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatGrams } from "@/lib/data";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getOrder, NEXT_STATUSES, ordersByPhone } from "@/lib/server/admin-orders";
import { requireAdmin } from "@/lib/server/auth";

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${(await params).orderNumber}` };
}

/** 03001234567 → 923001234567 for wa.me links */
const waNumber = (phone: string) => `92${phone.slice(1)}`;

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = getOrder(orderNumber);
  if (!order) notFound();

  const otherOrders = ordersByPhone(order.phone, order.orderNumber);
  const waText = encodeURIComponent(
    `Assalam-o-Alaikum ${order.customerName}, this is Harvo Foods Organic about your order ${order.orderNumber} (total ${formatPrice(order.total)}).`,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm font-medium text-forest-700 hover:underline">
          ← All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold sm:text-3xl">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)} · Cash on delivery</p>
      </div>

      <section className="rounded-xl border border-cream-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Update status</h2>
        <OrderStatusForm orderNumber={order.orderNumber} next={NEXT_STATUSES[order.status]} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-cream-200 bg-white">
          <h2 className="border-b border-cream-200 px-5 py-3 text-lg font-bold">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2 font-semibold">Product</th>
                  <th className="px-5 py-2 font-semibold">Size</th>
                  <th className="px-5 py-2 text-right font-semibold">Price</th>
                  <th className="px-5 py-2 text-right font-semibold">Qty</th>
                  <th className="px-5 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {order.items.map((i) => (
                  <tr key={`${i.productId}-${i.grams}`}>
                    <td className="px-5 py-3 font-medium">{i.productName}</td>
                    <td className="px-5 py-3">{formatGrams(i.grams)}</td>
                    <td className="px-5 py-3 text-right">{formatPrice(i.unitPrice)}</td>
                    <td className="px-5 py-3 text-right">× {i.qty}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatPrice(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="space-y-1.5 border-t border-cream-200 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>Total to collect (COD)</dt>
              <dd className="text-forest-900">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-cream-200 bg-white p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">Customer</h2>
            <p className="text-base font-semibold">{order.customerName}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`tel:${order.phone}`} className="rounded-lg border border-cream-200 px-3 py-1.5 font-semibold hover:border-forest-500">
                📞 {order.phone}
              </a>
              <a
                href={`https://wa.me/${waNumber(order.phone)}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cream-200 px-3 py-1.5 font-semibold hover:border-forest-500"
              >
                WhatsApp
              </a>
            </div>
            {order.email && (
              <p className="mt-3">
                <a href={`mailto:${order.email}`} className="text-forest-700 hover:underline">
                  {order.email}
                </a>
              </p>
            )}
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Delivery address</h3>
            <p className="mt-1 whitespace-pre-line">{order.address}</p>
            <p className="font-medium">{order.city}</p>
            {order.notes && (
              <>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Customer notes</h3>
                <p className="mt-1 whitespace-pre-line rounded-lg bg-cream-50 p-3">{order.notes}</p>
              </>
            )}
          </section>

          <section className="rounded-xl border border-cream-200 bg-white p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">History</h2>
            <ol className="space-y-2">
              {order.history.map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusBadge status={h.toStatus} />
                  <span className="text-muted">
                    {formatDateTime(h.changedAt)} · by {h.changedBy}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Other orders from this customer</h2>
        <OrdersTable orders={otherOrders} empty="This is the customer's first order." />
      </section>
    </div>
  );
}
