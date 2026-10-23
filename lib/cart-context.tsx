"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./data";
import { totalsFor } from "./pricing";

type CartLine = { id: string; grams: number; qty: number };
export type CartItem = Product & {
  key: string;
  grams: number;
  price: number;
  /** Packs currently in stock for this size. */
  stock: number;
  qty: number;
  lineTotal: number;
};

export const MAX_QTY = 99;

type CartContextValue = {
  items: CartItem[];
  /** False until the saved cart has been read from the browser. */
  ready: boolean;
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  /** True when any line asks for more than is in stock. */
  hasStockIssue: boolean;
  add: (id: string, grams: number, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  changeSize: (key: string, grams: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "harvo-cart-v3";
const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (l: Pick<CartLine, "id" | "grams">) => `${l.id}-${l.grams}`;
const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n)));

export function CartProvider({ catalog, children }: { catalog: Product[]; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  const productsById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  /** Keeps only well-formed lines for sizes that are still on sale. */
  const parseSaved = useCallback(
    (raw: string | null): CartLine[] => {
      if (!raw) return [];
      try {
        const data: unknown = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data.flatMap((l) => {
          const product = l && typeof l.id === "string" ? productsById.get(l.id) : undefined;
          const sizeOk = product?.variants.some((v) => v.grams === l.grams);
          return sizeOk && Number.isFinite(l.qty) && l.qty > 0
            ? [{ id: l.id as string, grams: l.grams as number, qty: clampQty(l.qty) }]
            : [];
        });
      } catch {
        return [];
      }
    },
    [productsById],
  );

  // Load the saved cart, and stay in sync when it changes in another tab.
  useEffect(() => {
    try {
      setLines(parseSaved(localStorage.getItem(STORAGE_KEY)));
    } catch {}
    setLoaded(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(parseSaved(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [parseSaved]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, loaded]);

  const add = useCallback((id: string, grams: number, qty = 1) => {
    setLines((prev) => {
      const key = lineKey({ id, grams });
      if (prev.some((l) => lineKey(l) === key)) {
        return prev.map((l) => (lineKey(l) === key ? { ...l, qty: clampQty(l.qty + qty) } : l));
      }
      return [...prev, { id, grams, qty: clampQty(qty) }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, qty: clampQty(qty) } : l)),
    );
  }, []);

  const changeSize = useCallback((key: string, grams: number) => {
    setLines((prev) => {
      const line = prev.find((l) => lineKey(l) === key);
      if (!line || line.grams === grams) return prev;

      // If that size is already in the cart, merge the two lines.
      const target = prev.find((l) => lineKey(l) === lineKey({ id: line.id, grams }));
      if (target) {
        return prev
          .filter((l) => l !== line)
          .map((l) => (l === target ? { ...l, qty: clampQty(l.qty + line.qty) } : l));
      }
      return prev.map((l) => (l === line ? { ...l, grams } : l));
    });
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines.flatMap((line): CartItem[] => {
      const product = productsById.get(line.id);
      const variant = product?.variants.find((v) => v.grams === line.grams);
      if (!product || !variant) return [];
      return [
        {
          ...product,
          key: lineKey(line),
          grams: line.grams,
          price: variant.price,
          stock: variant.stock,
          qty: line.qty,
          lineTotal: variant.price * line.qty,
        },
      ];
    });

    const { subtotal, delivery, total } = totalsFor(items.reduce((sum, i) => sum + i.lineTotal, 0));

    return {
      items,
      ready: loaded,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      delivery,
      total,
      hasStockIssue: items.some((i) => i.qty > i.stock),
      add,
      setQty,
      changeSize,
      remove,
      clear,
    };
  }, [lines, loaded, productsById, add, setQty, changeSize, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
