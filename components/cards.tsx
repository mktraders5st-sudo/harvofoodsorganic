import Image from "next/image";
import Link from "next/link";
import { countInCategory, type Category, type Product, type Recipe } from "@/lib/data";
import { cn } from "@/lib/format";
import { ClockIcon, UsersIcon } from "./icons";
import { ProductCard } from "./ProductCard";
import { ImagePlaceholder } from "./ui";

export { ProductCard };

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function CategoryCard({ category, className }: { category: Category; className?: string }) {
  return (
    <Link
      href={`/shop?category=${category.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-forest-100 shadow-sm ring-1 ring-cream-200 transition-shadow hover:shadow-xl hover:shadow-forest-900/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tomato-500/50",
        className ?? "aspect-[4/5]",
      )}
    >
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <p className="text-[11px] font-medium text-forest-100/90">{countInCategory(category.id)} products</p>
        <h3 className="mt-0.5 font-serif text-lg font-bold leading-tight text-white sm:text-xl">{category.name}</h3>
        <p className="mt-1 hidden text-xs text-white/80 sm:block">{category.blurb}</p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-tomato-600 px-3 py-1.5 text-[11px] font-semibold transition-colors group-hover:bg-tomato-500">
          Shop now <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const oddCount = categories.length % 2 === 1;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
      {categories.map((c, i) => (
        <CategoryCard
          key={c.id}
          category={c}
          // On phones, stretch a lone last card across both columns
          className={
            oddCount && i === categories.length - 1
              ? "col-span-2 aspect-[8/5] sm:col-span-1 sm:aspect-[4/5]"
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white">
      <div className="relative">
        <ImagePlaceholder label="Recipe photo" className="aspect-[4/3]" rounded="rounded-none" />
        <span className="absolute left-3 top-3 rounded-full bg-tomato-600 px-3 py-1 text-[11px] font-semibold text-white">
          {recipe.tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold">{recipe.title}</h3>
        <p className="mt-2 text-sm text-muted">{recipe.excerpt}</p>
        <div className="mt-auto flex flex-wrap gap-4 pt-5 text-xs font-medium text-forest-700">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4" /> {recipe.minutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <UsersIcon className="h-4 w-4" /> Serves {recipe.serves}
          </span>
          <span>{recipe.difficulty}</span>
        </div>
      </div>
    </article>
  );
}
