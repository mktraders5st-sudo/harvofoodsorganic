import type { Metadata } from "next";
import Link from "next/link";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { formatGrams, LOW_STOCK } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { dashboardStats, listOrders } from "@/lib/server/admin-orders";
import { requireAdmin } from "@/lib/server/auth";
import { lowStockVariants } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, { orders }, lowStock] = await Promise.all([dashboardStats(), listOrders({ page: 1 }), lowStockVariants(LOW_STOCK)]);

  const tiles = [
    { label: "New orders to confirm", value: stats.pending, href: "/admin/orders?status=pending", accent: stats.pending > 0 },
    { label: "Confirmed, to dispatch", value: stats.toDispatch, href: "/admin/orders?status=confirmed" },
    { label: "Orders today", value: stats.today, href: "/admin/orders" },
    { label: "Sales this month", value: formatPrice(stats.monthSales), href: "/admin/orders" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
              t.accent ? "border-tomato-500 bg-tomato-50" : "border-cream-200 bg-white"
            }`}
          >
            <p className="text-xs font-medium text-muted">{t.label}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl">{t.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-forest-700 hover:underline">
            All orders →
          </Link>
        </div>
        <OrdersTable orders={orders.slice(0, 8)} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Low stock (≤ {LOW_STOCK} packs)</h2>
        {lowStock.length === 0 ? (
          <p className="rounded-xl border border-cream-200 bg-white p-4 text-sm text-muted">All sizes are well stocked.</p>
        ) : (
          <ul className="divide-y divide-cream-200 rounded-xl border border-cream-200 bg-white">
            {lowStock.map((v) => (
              <li key={`${v.productId}-${v.grams}`} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/admin/products/${v.productId}`} className="font-medium hover:underline">
                  {v.name} · {formatGrams(v.grams)}
                </Link>
                <span className={v.stock === 0 ? "font-bold text-tomato-600" : "font-semibold text-amber-700"}>
                  {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
