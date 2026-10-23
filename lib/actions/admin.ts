"use server";

// Admin server actions. Every action except login starts with requireAdmin(),
// which applies the admin access rules on the server (see lib/server/auth.ts).
// Server Actions also reject requests coming from other websites (Origin check).

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_IDS } from "@/lib/data";
import { ORDER_STATUSES, setOrderStatus, StatusError } from "@/lib/server/admin-orders";
import { login, logout, requireAdmin } from "@/lib/server/auth";
import {
  addVariant,
  createProduct,
  deleteVariant,
  productExists,
  updateProduct,
  updateVariant,
} from "@/lib/server/catalog";
import { rateLimit } from "@/lib/server/rate-limit";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** What was submitted, so the form can refill itself after an error (React resets forms on submit). */
  values?: Record<string, string>;
};

/* ---------- Helpers ---------- */

const formValues = (fd: FormData) => Object.fromEntries(fd.entries());

/** Submitted text fields to send back after an error. Passwords are never echoed. */
function echo(fd: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && k !== "password" && !k.startsWith("$")) values[k] = v;
  return values;
}

function errorsFrom(error: z.ZodError, fd?: FormData): ActionState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { ok: false, message: "Please fix the highlighted fields.", errors, values: fd ? echo(fd) : undefined };
}
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const money = z.coerce.number().int("Use whole rupees").min(0, "Can't be negative").max(10_000_000, "Too large");
const stockQty = z.coerce.number().int("Use whole numbers").min(0, "Can't be negative").max(1_000_000, "Too large");
const gramsField = z.coerce.number().int("Use whole grams").min(1, "Must be at least 1 g").max(100_000, "Too large");

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function refreshCatalogPages(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/", "layout"); // storefront shows new prices and stock
}

/* ---------- Login / logout ---------- */

const loginSchema = z.object({
  password: z.string().min(1, "Enter the admin password").max(200),
  next: z.string().optional(),
});

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!rateLimit(`login:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes." };
  }

  const parsed = loginSchema.safeParse(formValues(fd));
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  const result = await login(parsed.data.password);
  if (!result.ok) return { ok: false, message: result.error, values: echo(fd) };

  // Only ever redirect inside the admin area (prevents open redirects).
  const next = parsed.data.next;
  redirect(next && /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------- Orders ---------- */

const statusSchema = z.object({
  orderNumber: z.string().regex(/^HRV-\d{6}-[A-Z0-9]{4}$/, "Invalid order"),
  status: z.enum(ORDER_STATUSES),
});

export async function updateOrderStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(formValues(fd));
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  try {
    setOrderStatus(parsed.data.orderNumber, parsed.data.status, admin.name);
  } catch (err) {
    if (err instanceof StatusError) return { ok: false, message: err.message };
    throw err;
  }

  revalidatePath(`/admin/orders/${parsed.data.orderNumber}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  if (parsed.data.status === "cancelled") refreshCatalogPages(); // stock was returned
  return { ok: true, message: `Order marked as ${parsed.data.status}.` };
}

/* ---------- Products ---------- */

/** Empty form fields become undefined (= not set). */
const optionalText = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  category: z.enum(CATEGORY_IDS, { message: "Choose a category" }),
  description: z.string().trim().max(500, "Up to 500 characters").default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #3f9d4c"),
  rim: optionalText(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #c42d2d")),
  image: optionalText(
    z
      .string()
      .regex(/^\/images\/[\w\-/]+\.(jpe?g|png|webp)$/i, "Use a path like /images/products/onion.jpg")
      .refine((v) => !v.includes(".."), "Invalid path"),
  ),
  badge: optionalText(z.enum(["Best Seller", "New"])),
  featured: checkbox,
  active: checkbox,
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, e.g. onion-powder")
  .max(60);

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export async function createProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = formValues(fd);

  const parsed = productSchema
    .extend({
      id: z.preprocess((v) => (typeof v === "string" && v.trim() ? v : slugify(String(values.name ?? ""))), slugSchema),
      grams: gramsField,
      price: money,
      stock: stockQty,
    })
    .safeParse(values);
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  const { id, grams, price, stock, ...fields } = parsed.data;
  if (productExists(id)) {
    return { ok: false, message: "A product with this ID already exists.", errors: { id: "Already in use" }, values: echo(fd) };
  }

  createProduct(id, fields);
  addVariant(id, { grams, price, stock });
  refreshCatalogPages(id);
  redirect(`/admin/products/${id}?created=1`);
}

export async function updateProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = formValues(fd);
  const id = slugSchema.safeParse(values.productId);
  if (!id.success) return { ok: false, message: "Invalid product." };

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  if (!updateProduct(id.data, parsed.data)) return { ok: false, message: "Product not found." };
  refreshCatalogPages(id.data);
  return { ok: true, message: "Product saved." };
}

/* ---------- Package sizes (variants) ---------- */

const variantRef = z.object({
  productId: slugSchema,
  variantId: z.coerce.number().int().positive(),
});

export async function updateVariantAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = variantRef
    .extend({ price: money, stock: stockQty, active: checkbox })
    .safeParse(formValues(fd));
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  const { productId, variantId, ...v } = parsed.data;
  if (!updateVariant(productId, variantId, v)) return { ok: false, message: "Size not found." };
  refreshCatalogPages(productId);
  return { ok: true, message: "Saved." };
}

export async function addVariantAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ productId: slugSchema, grams: gramsField, price: money, stock: stockQty })
    .safeParse(formValues(fd));
  if (!parsed.success) return errorsFrom(parsed.error, fd);

  const { productId, ...v } = parsed.data;
  if (!productExists(productId)) return { ok: false, message: "Product not found." };
  try {
    addVariant(productId, v);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return { ok: false, message: "This product already has that size.", errors: { grams: "Already exists" }, values: echo(fd) };
    }
    throw err;
  }
  refreshCatalogPages(productId);
  return { ok: true, message: "Size added." };
}

export async function deleteVariantAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = variantRef.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, message: "Invalid size." };

  if (!deleteVariant(parsed.data.productId, parsed.data.variantId)) return { ok: false, message: "Size not found." };
  refreshCatalogPages(parsed.data.productId);
  return { ok: true, message: "Size removed. Past orders keep their details." };
}
