import { z } from "zod";
import { PACK_SIZES } from "./prices";

// One set of rules, used for instant feedback in the browser AND enforced
// again on the server, which never trusts what the browser sends.

export const PAYMENT_METHOD = "COD" as const; // Cash on delivery is the only option; no card data is ever collected.

export const PK_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Hyderabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sukkur",
];

/** Accepts 03001234567, 0300-1234567, +92 300 1234567, 0092300… and returns 03001234567. */
export function normalizePkMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+92|0092|92|0)(3\d{9})$/);
  return match ? `0${match[1]}` : null;
}

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => (v ? v : undefined));

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(60, "Name is too long")
    .regex(/^[\p{L}][\p{L} .'-]*$/u, "Name can only contain letters, spaces and . ' -"),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const normalized = normalizePkMobile(v);
      if (!normalized) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Pakistani mobile number, e.g. 0300 1234567" });
        return z.NEVER;
      }
      return normalized;
    }),
  email: z
    .string()
    .trim()
    .max(100, "Email is too long")
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .refine((v) => v === undefined || z.string().email().safeParse(v).success, "Enter a valid email address"),
  city: z.string().trim().min(2, "Please enter your city").max(40, "City name is too long"),
  address: z
    .string()
    .trim()
    .min(10, "Please enter your full address (house, street, area)")
    .max(300, "Address is too long"),
  notes: optionalText(300, "Notes can be up to 300 characters"),
});

export const orderItemSchema = z.object({
  id: z.string().trim().min(1).max(60),
  grams: z.union([z.literal(50), z.literal(100), z.literal(250)]) satisfies z.ZodType<(typeof PACK_SIZES)[number]>,
  qty: z.number().int().min(1).max(99),
});

export const orderSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, "Your cart is empty").max(50, "Too many items in one order"),
  /** Random id created once per checkout, so a double-click can't create two orders. */
  idempotencyKey: z.string().uuid(),
  /** Hidden "website" field. Real people leave it empty; spam bots fill it in. */
  website: z.string().max(0).optional(),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type OrderInput = z.input<typeof orderSchema>;
export type ValidOrder = z.output<typeof orderSchema>;
export type FieldErrors = Partial<Record<keyof CustomerInput, string>>;

/** Turns zod issues into one message per form field. */
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[issue.path[0] === "customer" ? 1 : 0] as keyof CustomerInput;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
