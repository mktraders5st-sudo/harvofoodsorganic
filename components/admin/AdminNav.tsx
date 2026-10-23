"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Admin">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            isActive(l.href) ? "bg-white/15 text-white" : "text-forest-100/80 hover:bg-white/10 hover:text-white",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
