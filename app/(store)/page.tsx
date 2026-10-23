import Image from "next/image";
import { CategoryGrid, ProductGrid } from "@/components/cards";
import { TrustStrip, ValueGrid } from "@/components/FeatureList";
import { LeafIcon, WhatsAppIcon } from "@/components/icons";
import { Newsletter } from "@/components/Newsletter";
import { ButtonLink, Container, Eyebrow, Section, SectionHeading } from "@/components/ui";
import { categories, contactInfo, countByCategory } from "@/lib/data";
import { getCatalog } from "@/lib/server/catalog";

const packSizes = ["50 g", "100 g", "250 g"];

export default async function HomePage() {
  const products = await getCatalog();
  const featured = products.filter((p) => p.featured).slice(0, 8);

  return (
    <>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-50 via-cream-50 to-forest-100">
        <LeafIcon className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 -rotate-12 text-forest-500/10" />
        <LeafIcon className="pointer-events-none absolute -bottom-16 right-1/3 h-64 w-64 rotate-45 text-forest-500/10" />

        <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20">
          <div className="text-center lg:text-left">
            <p className="font-serif text-lg italic text-forest-700 sm:text-xl">Pure Goodness of Nature</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Healthy Food, <span className="text-tomato-600">Healthy Life</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg lg:mx-0">
              Premium organic vegetable powders, fruit powders, spices, dried fruit slices and masalas. 100%
              natural, with no preservatives, made in Karachi.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <ButtonLink href="/shop" variant="accent" className="px-8 py-3.5 text-base shadow-lg shadow-tomato-600/25">
                Shop Now <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href="#categories" variant="outline" className="py-3.5 text-base">
                Explore Categories
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="text-sm font-semibold text-forest-900">Available in:</span>
              {packSizes.map((s) => (
                <span key={s} className="rounded-full bg-forest-700 px-3 py-1 text-xs font-bold text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-forest-900/20 ring-8 ring-white sm:aspect-[16/11]">
              <Image
                src="/images/hero-produce.jpg"
                alt="Fresh vegetables, herbs, chillies and dried fruit slices"
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -left-3 -top-5 h-24 w-24 overflow-hidden rounded-full bg-white p-1 shadow-xl sm:-left-6 sm:-top-8 sm:h-32 sm:w-32">
              <Image src="/images/logo.png" alt="Harvo Organic emblem" fill sizes="128px" className="object-contain p-1" />
            </div>

            <div className="absolute -bottom-5 right-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-forest-900/15 sm:-bottom-6 sm:right-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-tomato-50 text-lg font-bold text-tomato-600">
                ✓
              </span>
              <span className="text-left">
                <span className="block text-sm font-bold text-forest-900">No Preservatives</span>
                <span className="block text-xs text-muted">Farm fresh, naturally dried</span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      <TrustStrip />

      {/* Categories */}
      <section id="categories" className="scroll-mt-28 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Shop by category"
            title="Explore our organic range"
            text="Five ranges, one promise: pure, natural and full of flavour."
          />
          <CategoryGrid categories={categories} counts={countByCategory(products)} />
        </Container>
      </section>

      {/* Featured products */}
      <Section className="bg-white">
        <SectionHeading eyebrow="Customer favourites" title="Featured products" text="Pick your pack size and add to cart." />
        <ProductGrid products={featured} />
        <div className="mt-10 text-center">
          <ButtonLink href="/shop" variant="outline">
            View All Products
          </ButtonLink>
        </div>
      </Section>

      {/* Benefits */}
      <section className="relative overflow-hidden bg-forest-900 py-16 sm:py-20">
        <LeafIcon className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-white/5" />
        <Container className="relative">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow className="text-tomato-100">Why choose Harvo</Eyebrow>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Goodness you can trust</h2>
            <p className="mt-3 text-forest-100/80">Every pack is made with the same four promises.</p>
          </div>
          <ValueGrid dark />
        </Container>
      </section>

      {/* WhatsApp order banner */}
      <Section>
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-tomato-600 px-6 py-10 text-center sm:px-12 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Prefer to order on WhatsApp?</h2>
            <p className="mt-2 text-tomato-50">Message us your order and we will deliver it to your door.</p>
          </div>
          <a
            href={contactInfo.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-forest-900 transition-colors hover:bg-cream-200"
          >
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
            {contactInfo.whatsapp}
          </a>
        </div>
      </Section>

      <Newsletter />
    </>
  );
}
