import type { Metadata } from "next";
import { ShopCatalog } from "@/components/ShopCatalog";
import { PageHero, Section } from "@/components/ui";
import { categories, type CategoryId } from "@/lib/data";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q = "" } = await searchParams;
  const initialCategory = categories.some((c) => c.id === category) ? (category as CategoryId) : undefined;

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Pure organic powders, slices & blends"
        text="Every product is 100% natural, preservative-free and available in 50 g, 100 g and 250 g packs."
      />
      <Section className="pt-10 sm:pt-12">
        {/* key resets the filters when arriving from a category link or the header search */}
        <ShopCatalog key={`${initialCategory ?? "all"}|${q}`} initialCategory={initialCategory} initialQuery={q} />
      </Section>
    </>
  );
}
