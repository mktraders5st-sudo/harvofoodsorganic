"use client";

import { useState } from "react";
import { getCategory, PACK_SIZES, type Grams, type Product } from "@/lib/data";
import { cn, formatPrice } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";
import { Rating } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category);
  const [grams, setGrams] = useState<Grams>(PACK_SIZES[0]);

  return (
    <article className="flex flex-col rounded-2xl border border-cream-200 bg-white p-3 transition-shadow hover:shadow-xl hover:shadow-forest-900/5">
      <div className="relative">
        <ProductImage product={product} className="aspect-square rounded-xl" />
        {product.badge && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white",
              product.badge === "New" ? "bg-forest-700" : "bg-tomato-600",
            )}
          >
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="text-xs text-muted">{category.name}</p>
        <h3 className="mt-0.5 font-sans text-[15px] font-semibold text-ink">{product.name}</h3>
        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviews} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Pack size">
          {PACK_SIZES.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={g === grams}
              onClick={() => setGrams(g)}
              className={cn(
                "rounded-full border py-1 text-[11px] font-semibold transition-colors",
                g === grams
                  ? "border-forest-700 bg-forest-700 text-white"
                  : "border-cream-200 text-forest-900 hover:border-forest-500",
              )}
            >
              {g}g
            </button>
          ))}
        </div>

        <p className="mt-3 text-lg font-bold text-forest-900">
          {formatPrice(product.prices[grams])}
          <span className="ml-1 text-xs font-medium text-muted">/ {grams}g</span>
        </p>

        <div className="mt-auto pt-3">
          <AddToCartButton productId={product.id} grams={grams} className="w-full py-2.5 text-sm" />
        </div>
      </div>
    </article>
  );
}
