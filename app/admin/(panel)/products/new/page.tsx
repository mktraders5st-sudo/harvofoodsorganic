import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/admin/products" className="text-sm font-medium text-forest-700 hover:underline">
        ← All products
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">Add product</h1>
      <section className="rounded-xl border border-cream-200 bg-white p-5">
        <ProductForm />
      </section>
      <p className="text-sm text-muted">You can add more package sizes after creating the product.</p>
    </div>
  );
}
