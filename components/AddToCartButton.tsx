"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/format";

export function AddToCartButton({
  productId,
  grams,
  className,
}: {
  productId: string;
  grams: number;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    add(productId, grams);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors",
        added ? "bg-forest-700" : "bg-tomato-600 hover:bg-tomato-700",
        className,
      )}
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
