import Link from "next/link";
import { cn } from "@/lib/format";
import { LeafIcon, StarIcon } from "./icons";

/* ---------- Layout ---------- */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("py-16 sm:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "accent" | "outline" | "light";

const variants: Record<Variant, string> = {
  primary: "bg-forest-700 text-white hover:bg-forest-900",
  accent: "bg-tomato-600 text-white hover:bg-tomato-700",
  outline: "border-2 border-forest-700 text-forest-700 hover:bg-forest-700 hover:text-white",
  light: "bg-white text-forest-900 hover:bg-cream-200",
};

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50",
    variants[variant],
    className,
  );
}

export function ButtonLink({
  href,
  variant,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}

/* ---------- Typography ---------- */

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-tomato-600", className)}>
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-10 max-w-2xl sm:mb-12", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  );
}

/* ---------- Page header used by inner pages ---------- */

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="border-b border-cream-200 bg-forest-50">
      <Container className="py-14 text-center sm:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {text && <p className="mx-auto mt-4 max-w-xl text-muted">{text}</p>}
      </Container>
    </div>
  );
}

/* ---------- Image placeholder (swap for next/image when photos are ready) ---------- */

export function ImagePlaceholder({
  label,
  tint = "from-forest-100 to-cream-200",
  className,
  rounded = "rounded-2xl",
}: {
  label?: string;
  tint?: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-gradient-to-br", tint, rounded, className)}>
      <LeafIcon className="h-10 w-10 text-forest-500/50" />
      {label && (
        <span className="absolute bottom-3 left-3 text-[10px] font-medium uppercase tracking-wider text-forest-700/60">
          {label}
        </span>
      )}
    </div>
  );
}

/* ---------- Rating ---------- */

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <span className="flex text-tomato-500" aria-label={`${value} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className={cn("h-3.5 w-3.5", i >= value && "opacity-25")} />
        ))}
      </span>
      {count !== undefined && <span>({count})</span>}
    </div>
  );
}
