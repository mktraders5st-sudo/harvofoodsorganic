"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { placeOrder } from "@/app/checkout/actions";
import { useCart } from "@/lib/cart-context";
import {
  customerSchema,
  fieldErrorsFrom,
  PK_CITIES,
  type CustomerInput,
  type FieldErrors,
} from "@/lib/checkout-schema";
import { contactInfo } from "@/lib/data";
import { cn, formatPrice } from "@/lib/format";
import type { PlacedOrder } from "@/lib/server/orders";
import { WhatsAppIcon } from "./icons";
import { ProductImage } from "./ProductImage";
import { buttonClasses, ButtonLink } from "./ui";

type Field = keyof CustomerInput;
type Values = Record<Field, string>;

const EMPTY: Values = { name: "", phone: "", email: "", city: "Karachi", address: "", notes: "" };
const FIELD_ORDER: Field[] = ["name", "phone", "email", "city", "address", "notes"];

const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition-colors sm:text-sm",
    invalid ? "border-tomato-500 focus:border-tomato-600" : "border-cream-200 focus:border-forest-500",
  );

function FormField({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: Field;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-forest-900">
        {label}
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-tomato-600" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/* ---------- Confirmation ---------- */

function OrderPlaced({ order, name, phone }: { order: PlacedOrder; name: string; phone: string }) {
  const message = encodeURIComponent(`Assalam-o-Alaikum Harvo! My order number is ${order.orderNumber}.`);
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-cream-200 bg-white px-6 py-10 text-center sm:px-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-100 text-3xl text-forest-700">✓</div>
      <h1 className="mt-5 text-3xl font-bold">Thank you, {name.split(" ")[0]}!</h1>
      <p className="mt-2 text-muted">Your order has been placed.</p>

      <div className="mt-6 rounded-2xl bg-forest-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Order number</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-forest-900">{order.orderNumber}</p>
        <p className="mt-3 text-sm text-forest-900">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · Total{" "}
          <strong>{formatPrice(order.total)}</strong> · Cash on delivery
        </p>
      </div>

      <p className="mt-6 text-sm text-muted">
        We&apos;ll call or message you on <strong className="text-forest-900">{phone}</strong> to confirm your order
        and delivery time. Please keep the exact amount ready in cash.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/shop" variant="primary">
          Continue Shopping
        </ButtonLink>
        <a
          href={`${contactInfo.whatsappLink}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("outline")}
        >
          <WhatsAppIcon className="h-4 w-4" /> Message us
        </a>
      </div>
    </div>
  );
}

/* ---------- Checkout ---------- */

export function CheckoutView() {
  const { items, ready, count, subtotal, delivery, total, clear } = useCart();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ order: PlacedOrder; name: string; phone: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // One key per checkout: resubmitting (double-click, retry) can't create a second order.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (placed) return <OrderPlaced {...placed} />;
  if (!ready) return <div className="min-h-64" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add some products before checking out.</p>
        <ButtonLink href="/shop" variant="accent" className="mt-6">
          Go to Shop
        </ButtonLink>
      </div>
    );
  }

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  /** Checks one field when the customer leaves it. */
  function validateField(field: Field) {
    const result = customerSchema.shape[field].safeParse(values[field]);
    setErrors((e) => ({ ...e, [field]: result.success ? undefined : result.error.issues[0]?.message }));
  }

  function focusFirstError(errs: FieldErrors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const check = customerSchema.safeParse(values);
    if (!check.success) {
      const errs = fieldErrorsFrom(check.error);
      setErrors(errs);
      focusFirstError(errs);
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrder({
          customer: values,
          items: items.map((i) => ({ id: i.id, grams: i.grams, qty: i.qty })),
          idempotencyKey,
          website: honeypot.current?.value ?? "",
        });

        if (result.ok) {
          setPlaced({ order: result.order, name: check.data.name, phone: check.data.phone });
          clear();
          window.scrollTo({ top: 0 });
        } else {
          setFormError(result.error);
          if (result.fieldErrors) {
            setErrors(result.fieldErrors);
            focusFirstError(result.fieldErrors);
          }
        }
      } catch {
        setFormError("Connection problem. Please check your internet and try again.");
      }
    });
  }

  const describedBy = (f: Field) => (errors[f] ? `${f}-error` : `${f}-hint`);

  return (
    <>
      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/cart" className="hover:text-forest-700">
          Cart
        </Link>{" "}
        / <span className="text-forest-900">Checkout</span>
      </nav>
      <h1 className="mb-6 text-3xl font-bold sm:mb-8 sm:text-4xl">Checkout</h1>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
        <div className="space-y-6">
          {/* Customer & delivery */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold">Delivery details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField id="name" label="Full name" error={errors.name}>
                <input
                  id="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => validateField("name")}
                  aria-invalid={!!errors.name}
                  aria-describedby={describedBy("name")}
                  className={inputClass(!!errors.name)}
                  maxLength={60}
                />
              </FormField>

              <FormField id="phone" label="Mobile number" hint="We'll call to confirm your order" error={errors.phone}>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  onBlur={() => validateField("phone")}
                  aria-invalid={!!errors.phone}
                  aria-describedby={describedBy("phone")}
                  className={inputClass(!!errors.phone)}
                  maxLength={20}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField id="email" label="Email" hint="For your order receipt" error={errors.email} optional>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() => validateField("email")}
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy("email")}
                    className={inputClass(!!errors.email)}
                    maxLength={100}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField id="city" label="City" error={errors.city}>
                  <input
                    id="city"
                    list="pk-cities"
                    autoComplete="address-level2"
                    value={values.city}
                    onChange={(e) => update("city", e.target.value)}
                    onBlur={() => validateField("city")}
                    aria-invalid={!!errors.city}
                    aria-describedby={describedBy("city")}
                    className={inputClass(!!errors.city)}
                    maxLength={40}
                  />
                  <datalist id="pk-cities">
                    {PK_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  id="address"
                  label="Delivery address"
                  hint="House / flat no., street, block and area"
                  error={errors.address}
                >
                  <textarea
                    id="address"
                    rows={3}
                    autoComplete="street-address"
                    value={values.address}
                    onChange={(e) => update("address", e.target.value)}
                    onBlur={() => validateField("address")}
                    aria-invalid={!!errors.address}
                    aria-describedby={describedBy("address")}
                    className={inputClass(!!errors.address)}
                    maxLength={300}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField id="notes" label="Order notes" hint="e.g. nearest landmark or best time to call" error={errors.notes} optional>
                  <textarea
                    id="notes"
                    rows={2}
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    onBlur={() => validateField("notes")}
                    aria-invalid={!!errors.notes}
                    aria-describedby={describedBy("notes")}
                    className={inputClass(!!errors.notes)}
                    maxLength={300}
                  />
                </FormField>
              </div>
            </div>

            {/* Spam trap: hidden from people, filled in by bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold">Payment</h2>
            <label className="mt-4 flex cursor-default items-start gap-3 rounded-xl border-2 border-forest-700 bg-forest-50 p-4">
              <input type="radio" name="payment" checked readOnly className="mt-1 h-4 w-4 accent-forest-700" />
              <span>
                <span className="block font-semibold text-forest-900">Cash on Delivery</span>
                <span className="block text-sm text-muted">
                  Pay in cash when your order arrives. We never ask for card or bank details.
                </span>
              </span>
            </label>
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-cream-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Order summary</h2>
            <Link href="/cart" className="text-sm font-medium text-forest-700 hover:underline">
              Edit cart
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-cream-200">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-3">
                <div className="relative shrink-0">
                  <ProductImage product={item} className="h-14 w-14 rounded-lg" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-forest-700 px-1 text-[10px] font-bold text-white">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.grams}g · {formatPrice(item.price)} each
                  </p>
                </div>
                <p className="text-sm font-semibold text-forest-900">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2.5 border-t border-cream-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal ({count} items)</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium">{delivery === 0 ? "Free" : formatPrice(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-cream-200 pt-3 text-base">
              <dt className="font-semibold">Total to pay on delivery</dt>
              <dd className="text-lg font-bold text-forest-900">{formatPrice(total)}</dd>
            </div>
          </dl>

          {formError && (
            <p className="mt-4 rounded-xl bg-tomato-50 p-3 text-sm font-medium text-tomato-700" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" disabled={pending} className={buttonClasses("accent", "mt-5 w-full py-4 text-base")}>
            {pending ? "Placing order…" : `Place Order · ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Final prices are confirmed by our server when you place the order.
          </p>
        </aside>
      </form>
    </>
  );
}
