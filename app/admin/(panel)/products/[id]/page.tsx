import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantEditor } from "@/components/admin/VariantEditor";
import { ProductImage } from "@/components/ProductImage";
import { requireAdmin } from "@/lib/server/auth";
import { getProductById } from "@/lib/server/catalog";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductById((await params).id);
  return { title: product ? `Edit ${product.name}` : "Product" };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const product = getProductById(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm font-medium text-forest-700 hover:underline">
        ← All products
      </Link>

      <div className="flex items-center gap-4">
        <ProductImage product={product} className="h-16 w-16 shrink-0 rounded-lg" />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <p className="text-sm text-muted">
            ID: <code>{product.id}</code> ·{" "}
            {product.active ? (
              <Link href={`/shop?q=${encodeURIComponent(product.name)}`} target="_blank" className="text-forest-700 hover:underline">
                View in shop ↗
              </Link>
            ) : (
              "Hidden from shop"
            )}
          </p>
        </div>
      </div>

      {created && (
        <p role="status" className="rounded-xl bg-forest-100 p-3 text-sm font-medium text-forest-900">
          Product created. Add any other package sizes below.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-cream-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold">Details</h2>
          <ProductForm product={product} />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-bold">Package sizes, prices & stock</h2>
          <p className="mb-4 text-sm text-muted">
            Stock goes down automatically with each order and comes back if an order is cancelled.
          </p>
          <VariantEditor product={product} />
        </section>
      </div>
    </div>
  );
}
