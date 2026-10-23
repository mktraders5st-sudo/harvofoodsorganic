import type { Metadata } from "next";
import { ValueGrid } from "@/components/FeatureList";
import { ButtonLink, Container, Eyebrow, ImagePlaceholder, PageHero, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "About Us" };

const milestones = [
  { year: "2024", text: "Harvo starts with 5 partner farms and a small delivery van." },
  { year: "2025", text: "Grew to 40+ farms and launched the weekly veggie box." },
  { year: "2026", text: "Serving 10,000+ families with 150+ organic products." },
];

const stats = [
  { value: "40+", label: "Partner farms" },
  { value: "150+", label: "Products" },
  { value: "10k+", label: "Families served" },
  { value: "0", label: "Chemicals used" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Growing food the way nature intended"
        text="We believe every family deserves food that is clean, honest and full of real nutrition."
      />

      {/* Story */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-[1.4fr_1fr] gap-4">
            <ImagePlaceholder label="Farm photo" className="row-span-2 min-h-80" />
            <ImagePlaceholder label="Farmer" tint="from-tomato-100 to-cream-100" className="aspect-square" />
            <ImagePlaceholder label="Harvest" tint="from-cream-200 to-forest-100" className="aspect-square" />
          </div>
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="text-3xl font-bold sm:text-4xl">From small farms to your family table</h2>
            <p className="mt-5 text-muted">
              Harvo Foods Organic began with a simple question: why is it so hard to find food we can truly trust?
              We set out to answer it by partnering directly with small farms that grow using traditional,
              chemical-free methods.
            </p>
            <p className="mt-4 text-muted">
              Today we bring their harvest straight to your kitchen, fresh, fairly priced, and with complete
              transparency about where it comes from.
            </p>
            <ButtonLink href="/shop" variant="accent" className="mt-7">
              Shop Our Products
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <section className="bg-forest-900 py-14">
        <Container className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-serif text-4xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-forest-100/80">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Values */}
      <Section>
        <SectionHeading eyebrow="Our promise" title="What we stand for" />
        <ValueGrid />
      </Section>

      {/* Journey */}
      <Section className="bg-white">
        <SectionHeading eyebrow="Our journey" title="How we got here" />
        <ol className="mx-auto max-w-2xl space-y-6 border-l-2 border-forest-100 pl-8">
          {milestones.map((m) => (
            <li key={m.year} className="relative">
              <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-white bg-tomato-600" />
              <p className="font-serif text-2xl font-bold text-forest-900">{m.year}</p>
              <p className="mt-1 text-muted">{m.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-3xl bg-tomato-600 px-6 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Are you an organic farmer?</h2>
          <p className="mx-auto mt-3 max-w-md text-tomato-50">
            Join our network of partner farms and bring your harvest to thousands of families.
          </p>
          <ButtonLink href="/contact" variant="light" className="mt-7">
            Partner With Us
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
