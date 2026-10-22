"use client";

import { useMemo, useState } from "react";
import { categories, getCategory, products, startingPrice, type CategoryId, type Product } from "@/lib/data";
import { cn } from "@/lib/format";
import { ProductGrid } from "./cards";
import { SearchIcon } from "./icons";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(!!b.featured) - Number(!!a.featured),
  "price-asc": (a, b) => startingPrice(a) - startingPrice(b),
  "price-desc": (a, b) => startingPrice(b) - startingPrice(a),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
};

export function ShopCatalog({
  initialCategory,
  initialQuery = "",
}: {
  initialCategory?: CategoryId;
  initialQuery?: string;
}) {
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory ?? "all");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (p: Product) =>
      !q || p.name.toLowerCase().includes(q) || getCategory(p.category).name.toLowerCase().includes(q);
    const list = products.filter((p) => (category === "all" || p.category === category) && matches(p));
    return [...list].sort(sorters[sort]);
  }, [category, query, sort]);

  const chips: { id: CategoryId | "all"; name: string }[] = [{ id: "all", name: "All" }, ...categories];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="w-full rounded-full border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-forest-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-cream-200 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-forest-500"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>

      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              category === c.id
                ? "border-forest-700 bg-forest-700 text-white"
                : "border-cream-200 bg-white text-forest-900 hover:border-forest-500",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        Showing {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>

      {visible.length > 0 ? (
        <ProductGrid products={visible} />
      ) : (
        <div className="rounded-2xl border border-dashed border-cream-300 py-16 text-center text-muted">
          No products match your search.
        </div>
      )}
    </div>
  );
}
