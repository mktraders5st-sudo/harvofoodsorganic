// Server-only: read and write the product catalogue (Supabase / PostgreSQL).
// All values are passed as query parameters, never pasted into SQL text.

import type postgres from "postgres";
import type { Badge, CategoryId, Product, Variant } from "../data";
import { db } from "./db";

type ProductRow = {
  id: string;
  category_id: CategoryId;
  name: string;
  description: string;
  color: string;
  rim: string | null;
  image: string | null;
  rating: number;
  reviews: number;
  badge: Badge | null;
  featured: boolean;
  active: boolean;
};

type VariantRow = { id: number; product_id: string; grams: number; price: number; stock: number; active: boolean };

function toProduct(row: ProductRow, variants: VariantRow[]): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category_id,
    description: row.description,
    color: row.color,
    rim: row.rim ?? undefined,
    image: row.image ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    badge: row.badge ?? undefined,
    featured: row.featured,
    active: row.active,
    variants: variants.map((v): Variant => ({ id: v.id, grams: v.grams, price: v.price, stock: v.stock, active: v.active })),
  };
}

/** The main photo is the product image with the lowest sort_order. */
const MAIN_IMAGE = `(select url from product_images i where i.product_id = p.id order by i.sort_order limit 1)`;

/**
 * Storefront: only active products with their active sizes.
 * Admin (`includeInactive`): everything.
 */
export async function getCatalog({ includeInactive = false } = {}): Promise<Product[]> {
  const sql = db();
  const [rows, variants] = await Promise.all([
    sql<ProductRow[]>`
      select p.id, p.category_id, p.name, p.description, p.color, p.rim, ${sql.unsafe(MAIN_IMAGE)} as image,
             p.rating, p.reviews, p.badge, p.featured, p.active
      from products p
      ${includeInactive ? sql`` : sql`where p.active`}
      order by p.sort_order, p.name`,
    sql<VariantRow[]>`
      select id, product_id, grams, price, stock, active from product_variants
      ${includeInactive ? sql`` : sql`where active`}
      order by grams`,
  ]);

  const byProduct = new Map<string, VariantRow[]>();
  for (const v of variants) byProduct.set(v.product_id, [...(byProduct.get(v.product_id) ?? []), v]);

  return rows
    .map((r) => toProduct(r, byProduct.get(r.id) ?? []))
    .filter((p) => includeInactive || p.variants.length > 0);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const sql = db();
  const [row] = await sql<ProductRow[]>`
    select p.id, p.category_id, p.name, p.description, p.color, p.rim, ${sql.unsafe(MAIN_IMAGE)} as image,
           p.rating, p.reviews, p.badge, p.featured, p.active
    from products p where p.id = ${id}`;
  if (!row) return undefined;
  const variants = await sql<VariantRow[]>`
    select id, product_id, grams, price, stock, active from product_variants where product_id = ${id} order by grams`;
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

/** Sets (or clears) the product's main photo, keeping any extra photos. */
async function setMainImage(sql: postgres.TransactionSql, productId: string, url: string | undefined, alt: string) {
  if (url) {
    await sql`
      insert into product_images (product_id, url, alt, sort_order) values (${productId}, ${url}, ${alt}, 0)
      on conflict (product_id, sort_order) do update set url = excluded.url, alt = excluded.alt`;
  } else {
    await sql`delete from product_images where product_id = ${productId} and sort_order = 0`;
  }
}

export async function createProduct(id: string, fields: ProductFields) {
  await db().begin(async (sql) => {
    await sql`
      insert into products (id, category_id, name, description, color, rim, badge, featured, active, sort_order)
      values (${id}, ${fields.category}, ${fields.name}, ${fields.description}, ${fields.color}, ${fields.rim ?? null},
              ${fields.badge ?? null}, ${fields.featured}, ${fields.active},
              (select coalesce(max(sort_order), 0) + 1 from products))`;
    await setMainImage(sql, id, fields.image, fields.name);
  });
}

export async function updateProduct(id: string, fields: ProductFields) {
  return db().begin(async (sql) => {
    const result = await sql`
      update products set name = ${fields.name}, category_id = ${fields.category}, description = ${fields.description},
             color = ${fields.color}, rim = ${fields.rim ?? null}, badge = ${fields.badge ?? null},
             featured = ${fields.featured}, active = ${fields.active}, updated_at = now()
      where id = ${id}`;
    if (result.count === 0) return false;
    await setMainImage(sql, id, fields.image, fields.name);
    return true;
  });
}

export async function productExists(id: string) {
  const [row] = await db()`select 1 from products where id = ${id}`;
  return !!row;
}

export async function addVariant(productId: string, v: { grams: number; price: number; stock: number }) {
  await db()`insert into product_variants (product_id, grams, price, stock) values (${productId}, ${v.grams}, ${v.price}, ${v.stock})`;
}

export async function updateVariant(productId: string, variantId: number, v: { price: number; stock: number; active: boolean }) {
  const result = await db()`
    update product_variants set price = ${v.price}, stock = ${v.stock}, active = ${v.active}
    where id = ${variantId} and product_id = ${productId}`;
  return result.count > 0;
}

export async function deleteVariant(productId: string, variantId: number) {
  const result = await db()`delete from product_variants where id = ${variantId} and product_id = ${productId}`;
  return result.count > 0;
}

export async function lowStockVariants(threshold: number) {
  return db()<{ productId: string; name: string; grams: number; stock: number }[]>`
    select p.id as "productId", p.name, v.grams, v.stock
    from product_variants v join products p on p.id = v.product_id
    where p.active and v.active and v.stock <= ${threshold}
    order by v.stock, p.name`;
}
