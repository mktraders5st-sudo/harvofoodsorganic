import type { Metadata } from "next";
import Link from "next/link";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { cn } from "@/lib/format";
import { listOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/server/admin-orders";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = ORDER_STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : undefined;
  const q = (params.q ?? "").slice(0, 60);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { orders, total, pages } = await listOrders({ status, q, page });

  const link = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status, q: q || undefined, page: undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") sp.set(k, String(v));
    const s = sp.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Orders</h1>
        <form className="flex w-full gap-2 sm:w-auto" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order no., name or phone"
            aria-label="Search orders"
            className="min-w-0 flex-1 rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-forest-500 sm:w-64"
          />
          <button type="submit" className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-900">
            Search
          </button>
        </form>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={link({ status: s })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize",
              s === status ? "border-forest-700 bg-forest-700 text-white" : "border-cream-200 bg-white hover:border-forest-500",
            )}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted">
        {total} {total === 1 ? "order" : "orders"}
        {q && <> matching “{q}”</>}
      </p>

      <OrdersTable orders={orders} empty={q || status ? "No orders match these filters." : "No orders yet."} />

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={link({ page: page - 1 })} className="font-semibold text-forest-700">← Newer</Link> : <span />}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={link({ page: page + 1 })} className="font-semibold text-forest-700">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
