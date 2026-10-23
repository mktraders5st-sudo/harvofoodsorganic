import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { formatGrams, getCategory, LOW_STOCK } from "@/lib/data";
import { cn, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { getCatalog } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getCatalog({ includeInactive: true });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-900">
          + Add product
        </Link>
      </div>
      <p className="text-sm text-muted">
        {products.length} products · Click a product to edit its details, package sizes, prices and stock.
      </p>

      <ul className="grid gap-3 md:grid-cols-2">
        {products.map((p) => {
          const liveSizes = p.variants.filter((v) => v.active);
          return (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className={cn(
                  "flex gap-4 rounded-xl border bg-white p-3 transition-shadow hover:shadow-md",
                  p.active ? "border-cream-200" : "border-dashed border-cream-300 opacity-70",
                )}
              >
                <ProductImage product={p} className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-muted">{getCategory(p.category).name}</p>
                    </div>
                    {!p.active && (
                      <span className="shrink-0 rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-semibold text-muted">Hidden</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {liveSizes.length === 0 && <span className="text-xs font-semibold text-tomato-600">No sizes on sale</span>}
                    {liveSizes.map((v) => (
                      <span
                        key={v.id}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px]",
                          v.stock === 0
                            ? "border-tomato-500 bg-tomato-50 text-tomato-700"
                            : v.stock <= LOW_STOCK
                              ? "border-amber-400 bg-amber-50 text-amber-800"
                              : "border-cream-200 text-forest-900",
                        )}
                      >
                        {formatGrams(v.grams)} · {formatPrice(v.price)} · <strong>{v.stock}</strong> in stock
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
