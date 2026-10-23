import Link from "next/link";
import { categories, contactInfo, socialLinks } from "@/lib/data";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./Logo";
import { Container } from "./ui";

// Only profiles with a link set in lib/data.ts are shown.
const socials = [
  { label: "Instagram", short: "Ig", href: socialLinks.instagram },
  { label: "Facebook", short: "Fb", href: socialLinks.facebook },
  { label: "TikTok", short: "Tk", href: socialLinks.tiktok },
  { label: "Threads", short: "Th", href: socialLinks.threads },
].filter((s) => s.href);

const quickLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/about", label: "About Us" },
  { href: "/recipes", label: "Recipes" },
  { href: "/contact", label: "Contact" },
  { href: "/cart", label: "Your Cart" },
];

const contactRows = [
  { icon: PhoneIcon, value: contactInfo.phone, href: `tel:${contactInfo.phone}` },
  { icon: WhatsAppIcon, value: contactInfo.whatsapp, href: contactInfo.whatsappLink },
  { icon: MailIcon, value: contactInfo.email, href: `mailto:${contactInfo.email}` },
  { icon: PinIcon, value: contactInfo.address },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-white">{children}</h4>;
}

export function Footer() {
  return (
    <footer className="bg-forest-950 pt-16 pb-8 text-sm text-forest-100/80">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.6fr]">
          <div>
            <Logo light alwaysShowText />
            <p className="mt-4 max-w-xs">
              Pure goodness of nature. 100% natural powders, dried fruit slices and masalas with no preservatives.
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-xs font-semibold hover:border-tomato-500 hover:bg-tomato-600 hover:text-white"
                  >
                    {s.short}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <FooterHeading>Categories</FooterHeading>
            <ul className="space-y-2.5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.id}`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Quick links</FooterHeading>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Get in touch</FooterHeading>
            <ul className="space-y-3">
              {contactRows.map(({ icon: Icon, value, href }) => (
                <li key={value} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-tomato-500" />
                  {href ? (
                    <a href={href} className="break-all hover:text-white">
                      {value}
                    </a>
                  ) : (
                    <span>{value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Harvo Foods Organic. All rights reserved.</span>
          <span>100% Organic · No Preservatives · Farm Fresh</span>
        </div>
      </Container>
    </footer>
  );
}
