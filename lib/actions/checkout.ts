"use server";

import { headers } from "next/headers";
import { fieldErrorsFrom, orderSchema, type FieldErrors, type OrderInput } from "@/lib/checkout-schema";
import { createOrder, OrderError, type PlacedOrder } from "@/lib/server/orders";
import { rateLimit } from "@/lib/server/rate-limit";

export type PlaceOrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

const GENERIC_ERROR = "Sorry, we couldn't place your order. Please try again or order on WhatsApp.";

// Server Actions only accept same-site requests (Next.js checks the Origin header),
// so other websites can't submit orders on a visitor's behalf.
export async function placeOrder(input: OrderInput): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    // Bot filled the hidden field: pretend nothing happened, save nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) {
      return { ok: false, error: GENERIC_ERROR };
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Counts only valid order attempts, so fixing form mistakes never locks a customer out.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`order:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, error: "Too many orders from this connection. Please wait a few minutes and try again." };
  }

  try {
    return { ok: true, order: createOrder(parsed.data) };
  } catch (err) {
    if (err instanceof OrderError) return { ok: false, error: err.message };
    // Log the failure without customer details.
    console.error("[checkout] failed to save order:", err instanceof Error ? err.message : err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
