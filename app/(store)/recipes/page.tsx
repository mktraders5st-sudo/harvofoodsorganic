import type { Metadata } from "next";
import { RecipeCard } from "@/components/cards";
import { ClockIcon, UsersIcon } from "@/components/icons";
import { Newsletter } from "@/components/Newsletter";
import { ButtonLink, Eyebrow, ImagePlaceholder, PageHero, Section } from "@/components/ui";
import { recipes } from "@/lib/data";
import { getCatalog } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Recipes" };

export default function RecipesPage() {
  const [featured, ...rest] = recipes;
  const catalog = getCatalog();
  const featuredIngredients = featured.ingredients
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <>
      <PageHero
        eyebrow="Recipes"
        title="Cook something wholesome"
        text="Simple, healthy recipes made with Harvo organic ingredients."
      />

      {/* Featured recipe */}
      <Section className="pb-0 sm:pb-0">
        <article className="grid overflow-hidden rounded-3xl border border-cream-200 bg-white lg:grid-cols-2">
          <ImagePlaceholder label="Featured recipe photo" className="min-h-72" rounded="rounded-none" />
          <div className="p-7 sm:p-10">
            <Eyebrow>Recipe of the week · {featured.tag}</Eyebrow>
            <h2 className="text-3xl font-bold sm:text-4xl">{featured.title}</h2>
            <p className="mt-4 text-muted">{featured.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium text-forest-700">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" /> {featured.minutes} min
              </span>
              <span className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" /> Serves {featured.serves}
              </span>
              <span>{featured.difficulty}</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-forest-900">Harvo ingredients used</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {featuredIngredients.map((p) => (
                <li key={p.id} className="rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-forest-700">
                  {p.name}
                </li>
              ))}
            </ul>
            <ButtonLink href="/shop" variant="accent" className="mt-7">
              Shop Ingredients
            </ButtonLink>
          </div>
        </article>
      </Section>

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </Section>

      <Newsletter />
    </>
  );
}
