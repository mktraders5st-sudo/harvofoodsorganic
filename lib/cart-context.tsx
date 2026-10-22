"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct, PACK_SIZES, type Grams, type Product } from "./data";
import { totalsFor } from "./pricing";

type CartLine = { id: string; grams: Grams; qty: number };
export type CartItem = Product & { key: string; grams: Grams; price: number; qty: number; lineTotal: number };

export const MAX_QTY = 99;

type CartContextValue = {
  items: CartItem[];
  /** False until the saved cart has been read from the browser. */
  ready: boolean;
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  add: (id: string, grams: Grams, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  changeSize: (key: string, grams: Grams) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "harvo-cart-v2";
const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (l: Pick<CartLine, "id" | "grams">) => `${l.id}-${l.grams}`;
const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n)));

/** Keeps only well-formed lines for products that still exist, so a stale or edited save can't break the cart. */
function parseSaved(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.flatMap((l) =>
      l &&
      typeof l.id === "string" &&
      getProduct(l.id) &&
      PACK_SIZES.includes(l.grams) &&
      Number.isFinite(l.qty) &&
      l.qty > 0
        ? [{ id: l.id, grams: l.grams as Grams, qty: clampQty(l.qty) }]
        : [],
    );
  } catch {
    return [];
  }
}

/** Adds qty to a matching line, or appends a new one. */
function mergeLine(lines: CartLine[], line: CartLine): CartLine[] {
  const key = lineKey(line);
  if (lines.some((l) => lineKey(l) === key)) {
    return lines.map((l) => (lineKey(l) === key ? { ...l, qty: clampQty(l.qty + line.qty) } : l));
  }
  return [...lines, { ...line, qty: clampQty(line.qty) }];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, loaded]);

  const add = useCallback((id: string, grams: Grams, qty = 1) => {
    setLines((prev) => mergeLine(prev, { id, grams, qty }));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => lineKey(l) !== key) : prev.map((l) => (lineKey(l) === key ? { ...l, qty: clampQty(qty) } : l)),
    );
  }, []);

  const changeSize = useCallback((key: string, grams: Grams) => {
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
    const items = lines.flatMap((line) => {
      const product = getProduct(line.id);
      if (!product) return [];
      const price = product.prices[line.grams];
      return [{ ...product, key: lineKey(line), grams: line.grams, price, qty: line.qty, lineTotal: price * line.qty }];
    });

    const { subtotal, delivery, total } = totalsFor(items.reduce((sum, i) => sum + i.lineTotal, 0));

    return {
      items,
      ready: loaded,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      delivery,
      total,
      add,
      setQty,
      changeSize,
      remove,
      clear,
    };
  }, [lines, loaded, add, setQty, changeSize, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
