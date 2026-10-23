// Server-only: read and write the product catalogue.

import type { Badge, CategoryId, Product, Variant } from "../data";
import { getDb } from "./db";

type ProductRow = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  color: string;
  rim: string | null;
  image: string | null;
  rating: number;
  reviews: number;
  badge: Badge | null;
  featured: number;
  active: number;
};

type VariantRow = { id: number; product_id: string; grams: number; price: number; stock: number; active: number };

function toProduct(row: ProductRow, variants: VariantRow[]): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    color: row.color,
    rim: row.rim ?? undefined,
    image: row.image ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    badge: row.badge ?? undefined,
    featured: row.featured === 1,
    active: row.active === 1,
    variants: variants.map(
      (v): Variant => ({ id: v.id, grams: v.grams, price: v.price, stock: v.stock, active: v.active === 1 }),
    ),
  };
}

/**
 * Storefront: only active products with their active sizes.
 * Admin (`includeInactive`): everything.
 */
export function getCatalog({ includeInactive = false } = {}): Product[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM products ${includeInactive ? "" : "WHERE active = 1"} ORDER BY sort_order, name`,
    )
    .all() as ProductRow[];
  const variants = db
    .prepare(
      `SELECT * FROM product_variants ${includeInactive ? "" : "WHERE active = 1"} ORDER BY grams`,
    )
    .all() as VariantRow[];

  const byProduct = new Map<string, VariantRow[]>();
  for (const v of variants) byProduct.set(v.product_id, [...(byProduct.get(v.product_id) ?? []), v]);

  return rows
    .map((r) => toProduct(r, byProduct.get(r.id) ?? []))
    .filter((p) => includeInactive || p.variants.length > 0);
}

export function getProductById(id: string): Product | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!row) return undefined;
  const variants = db
    .prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY grams")
    .all(id) as VariantRow[];
  return toProduct(row, variants);
}

/* ---------- Admin writes (callers must check admin access first) ---------- */

export type ProductFields = {
  name: string;
  category: CategoryId;
  description: string;
  color: string;
  rim?: string;
  image?: string;
  badge?: Badge;
  featured: boolean;
  active: boolean;
};

export function createProduct(id: string, fields: ProductFields) {
  const db = getDb();
  const { next } = db.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM products").get() as {
    next: number;
  };
  db.prepare(
    `INSERT INTO products (id, name, category, description, color, rim, image, badge, featured, active, sort_order)
     VALUES (@id, @name, @category, @description, @color, @rim, @image, @badge, @featured, @active, @sortOrder)`,
  ).run({ id, ...productParams(fields), sortOrder: next });
}

export function updateProduct(id: string, fields: ProductFields) {
  const result = getDb()
    .prepare(
      `UPDATE products SET name = @name, category = @category, description = @description, color = @color,
              rim = @rim, image = @image, badge = @badge, featured = @featured, active = @active,
              updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ id, ...productParams(fields) });
  return result.changes > 0;
}

function productParams(f: ProductFields) {
  return {
    name: f.name,
    category: f.category,
    description: f.description,
    color: f.color,
    rim: f.rim ?? null,
    image: f.image ?? null,
    badge: f.badge ?? null,
    featured: f.featured ? 1 : 0,
    active: f.active ? 1 : 0,
  };
}

export function productExists(id: string) {
  return !!getDb().prepare("SELECT 1 FROM products WHERE id = ?").get(id);
}

export function addVariant(productId: string, v: { grams: number; price: number; stock: number }) {
  getDb()
    .prepare("INSERT INTO product_variants (product_id, grams, price, stock) VALUES (?, ?, ?, ?)")
    .run(productId, v.grams, v.price, v.stock);
}

export function updateVariant(productId: string, variantId: number, v: { price: number; stock: number; active: boolean }) {
  const result = getDb()
    .prepare("UPDATE product_variants SET price = ?, stock = ?, active = ? WHERE id = ? AND product_id = ?")
    .run(v.price, v.stock, v.active ? 1 : 0, variantId, productId);
  return result.changes > 0;
}

export function deleteVariant(productId: string, variantId: number) {
  const result = getDb()
    .prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ?")
    .run(variantId, productId);
  return result.changes > 0;
}

export function lowStockVariants(threshold: number) {
  return getDb()
    .prepare(
      `SELECT p.id AS productId, p.name, v.grams, v.stock
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE p.active = 1 AND v.active = 1 AND v.stock <= ?
       ORDER BY v.stock, p.name`,
    )
    .all(threshold) as { productId: string; name: string; grams: number; stock: number }[];
}
