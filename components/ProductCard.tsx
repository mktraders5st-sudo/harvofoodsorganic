"use client";

import { useState } from "react";
import { formatGrams, getCategory, LOW_STOCK, type Product } from "@/lib/data";
import { cn, formatPrice } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";
import { Rating } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category);
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [grams, setGrams] = useState(firstAvailable?.grams);
  const variant = product.variants.find((v) => v.grams === grams) ?? firstAvailable;
  const soldOut = !product.variants.some((v) => v.stock > 0);

  return (
    <article className="flex flex-col rounded-2xl border border-cream-200 bg-white p-3 transition-shadow hover:shadow-xl hover:shadow-forest-900/5">
      <div className="relative">
        <ProductImage product={product} className={cn("aspect-square rounded-xl", soldOut && "opacity-60")} />
        {soldOut ? (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Sold out
          </span>
        ) : (
          product.badge && (
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white",
                product.badge === "New" ? "bg-forest-700" : "bg-tomato-600",
              )}
            >
              {product.badge}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="text-xs text-muted">{category.name}</p>
        <h3 className="mt-0.5 font-sans text-[15px] font-semibold text-ink">{product.name}</h3>
        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviews} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pack size">
          {product.variants.map((v) => {
            const out = v.stock <= 0;
            return (
              <button
                key={v.grams}
                type="button"
                role="radio"
                aria-checked={v.grams === variant?.grams}
                aria-label={`${formatGrams(v.grams)}${out ? ", out of stock" : ""}`}
                onClick={() => setGrams(v.grams)}
                className={cn(
                  "min-w-14 flex-1 rounded-full border py-1 text-[11px] font-semibold transition-colors",
                  v.grams === variant?.grams
                    ? "border-forest-700 bg-forest-700 text-white"
                    : "border-cream-200 text-forest-900 hover:border-forest-500",
                  out && "line-through opacity-60",
                )}
              >
                {formatGrams(v.grams)}
              </button>
            );
          })}
        </div>

        {variant && (
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-forest-900">
              {formatPrice(variant.price)}
              <span className="ml-1 text-xs font-medium text-muted">/ {formatGrams(variant.grams)}</span>
            </p>
            {variant.stock > 0 && variant.stock <= LOW_STOCK && (
              <span className="text-[11px] font-semibold text-tomato-600">Only {variant.stock} left</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          {variant && variant.stock > 0 ? (
            <AddToCartButton productId={product.id} grams={variant.grams} className="w-full py-2.5 text-sm" />
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-cream-200 py-2.5 text-sm font-semibold text-muted"
            >
              Out of stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
