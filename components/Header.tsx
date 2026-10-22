"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { contactInfo } from "@/lib/data";
import { cn } from "@/lib/format";
import { CartIcon, CloseIcon, MenuIcon, PhoneIcon } from "./icons";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { Container } from "./ui";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/recipes", label: "Recipes" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-forest-900 text-forest-100">
        <Container className="flex items-center justify-center gap-6 py-2 text-xs sm:justify-between">
          <p>100% Organic · No Preservatives · Farm Fresh</p>
          <a href={`tel:${contactInfo.phone}`} className="hidden items-center gap-1.5 hover:text-white sm:flex">
            <PhoneIcon className="h-3.5 w-3.5" /> {contactInfo.phone}
          </a>
        </Container>
      </div>

      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <Container className="flex h-20 items-center gap-4 lg:gap-8">
          <Logo />

          <SearchBar className="hidden flex-1 md:block lg:max-w-sm" id="header-search" />

          <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 text-sm font-semibold transition-colors hover:text-tomato-600",
                  isActive(link.href)
                    ? "text-tomato-600 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-tomato-600"
                    : "text-forest-900",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative grid h-11 w-11 place-items-center rounded-full bg-forest-700 text-white hover:bg-forest-900"
            >
              <CartIcon className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-tomato-600 px-1 text-[10px] font-bold text-white ring-2 ring-cream-50">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream-200 bg-white text-forest-900 lg:hidden"
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </Container>

        {/* Search on phones */}
        <Container className="pb-3 md:hidden">
          <SearchBar id="mobile-search" />
        </Container>

        {open && (
          <nav className="border-t border-cream-200 bg-cream-50 lg:hidden" aria-label="Mobile">
            <Container className="flex flex-col py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-base font-semibold",
                    isActive(link.href) ? "bg-forest-100 text-forest-900" : "text-forest-900 hover:bg-cream-200",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </Container>
          </nav>
        )}
      </header>
    </>
  );
}
