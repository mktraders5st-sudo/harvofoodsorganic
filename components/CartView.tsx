"use client";

import { MAX_QTY, useCart, type CartItem } from "@/lib/cart-context";
import { contactInfo, FREE_DELIVERY_MIN, getCategory, PACK_SIZES, type Grams } from "@/lib/data";
import { cn, formatPrice } from "@/lib/format";
import { TrashIcon, WhatsAppIcon } from "./icons";
import { ProductImage } from "./ProductImage";
import { buttonClasses, ButtonLink } from "./ui";

/* ---------- Building blocks ---------- */

function QuantityStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const btn =
    "grid h-10 w-10 place-items-center rounded-full text-xl text-forest-900 transition-colors hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex items-center rounded-full border border-cream-200 bg-white" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n) && n > 0) onChange(n);
        }}
        aria-label="Quantity"
        className="w-9 rounded bg-transparent text-center text-sm font-semibold outline-none focus:bg-cream-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

function SizePicker({ item, onChange }: { item: CartItem; onChange: (g: Grams) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Pack size for ${item.name}`}>
      {PACK_SIZES.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={g === item.grams}
          onClick={() => onChange(g)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            g === item.grams
              ? "border-forest-700 bg-forest-700 text-white"
              : "border-cream-200 bg-white text-forest-900 hover:border-forest-500",
          )}
        >
          {g}g · {formatPrice(item.prices[g])}
        </button>
      ))}
    </div>
  );
}

function CartLineRow({ item }: { item: CartItem }) {
  const { setQty, changeSize, remove } = useCart();

  return (
    <li className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-3 sm:gap-5 sm:p-4">
      <ProductImage product={item} className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28" />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted">{getCategory(item.category).name}</p>
            <h3 className="font-sans text-base font-semibold leading-snug text-ink">{item.name}</h3>
          </div>
          <button
            type="button"
            onClick={() => remove(item.key)}
            aria-label={`Remove ${item.name} ${item.grams}g`}
            className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-tomato-50 hover:text-tomato-600"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <SizePicker item={item} onChange={(g) => changeSize(item.key, g)} />

        <div className="flex items-center justify-between gap-3">
          <QuantityStepper value={item.qty} onChange={(n) => setQty(item.key, n)} label={item.name} />
          <div className="text-right">
            <p className="font-bold text-forest-900">{formatPrice(item.lineTotal)}</p>
            {item.qty > 1 && <p className="text-[11px] text-muted">{formatPrice(item.price)} each</p>}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Pre-filled WhatsApp message with the full order, sent to the Harvo number. */
function whatsappOrderLink(items: CartItem[], subtotal: number, delivery: number, total: number) {
  const lines = [
    "Assalam-o-Alaikum Harvo! I'd like to order:",
    "",
    ...items.map((i) => `• ${i.name} (${i.grams}g) × ${i.qty} = ${formatPrice(i.lineTotal)}`),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    `Delivery: ${delivery === 0 ? "Free" : formatPrice(delivery)}`,
    `Total: ${formatPrice(total)}`,
  ];
  return `${contactInfo.whatsappLink}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/* ---------- Cart page ---------- */

export function CartView() {
  const { items, ready, count, subtotal, delivery, total, clear } = useCart();

  if (!ready) return <div className="min-h-64" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-16 text-center sm:py-20">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-muted">Pure, natural goodness is just a few taps away.</p>
        <ButtonLink href="/shop" variant="accent" className="mt-6">
          Start Shopping
        </ButtonLink>
      </div>
    );
  }

  const remaining = FREE_DELIVERY_MIN - subtotal;
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_MIN) * 100);
  const orderLink = whatsappOrderLink(items, subtotal, delivery, total);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted">
            {count} {count === 1 ? "item" : "items"}
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Remove all items from your cart?")) clear();
            }}
            className="text-sm font-medium text-tomato-600 hover:underline"
          >
            Clear cart
          </button>
        </div>

        <ul className="space-y-3">
          {items.map((item) => (
            <CartLineRow key={item.key} item={item} />
          ))}
        </ul>

        <ButtonLink href="/shop" variant="outline" className="mt-5 w-full sm:w-auto">
          ← Continue Shopping
        </ButtonLink>
      </div>

      <aside className="h-fit rounded-2xl border border-cream-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="text-xl font-bold">Order summary</h2>

        <div className="mt-4 rounded-xl bg-forest-50 p-3 text-xs text-forest-900">
          {remaining > 0 ? (
            <>
              Add <strong>{formatPrice(remaining)}</strong> more for free delivery
            </>
          ) : (
            <>🎉 You&apos;ve unlocked free delivery!</>
          )}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-100">
            <div className="h-full rounded-full bg-forest-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-medium">{delivery === 0 ? "Free" : formatPrice(delivery)}</dd>
          </div>
          <div className="flex justify-between border-t border-cream-200 pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="text-lg font-bold text-forest-900">{formatPrice(total)}</dd>
          </div>
        </dl>

        <ButtonLink href="/checkout" variant="accent" className="mt-6 hidden w-full py-3.5 text-base lg:flex">
          Proceed to Checkout →
        </ButtonLink>
        <a
          href={orderLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("outline", "mt-3 w-full")}
        >
          <WhatsAppIcon className="h-5 w-5" /> Order on WhatsApp instead
        </a>
        <p className="mt-3 text-center text-xs text-muted">Cash on delivery · No card details needed</p>
      </aside>

      {/* Phone checkout bar: sticks to the bottom of the screen while the cart is in view, never over the footer */}
      <div className="sticky bottom-0 z-30 -mx-4 border-t border-cream-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(16,80,31,0.08)] backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">Total ({count} items)</p>
            <p className="text-lg font-bold leading-tight text-forest-900">{formatPrice(total)}</p>
          </div>
          <ButtonLink href="/checkout" variant="accent" className="ml-auto flex-1 py-3.5 text-sm">
            Checkout →
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
