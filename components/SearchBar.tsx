import Form from "next/form";
import { cn } from "@/lib/format";
import { SearchIcon } from "./icons";

/** Submits to /shop?q=... using client-side navigation. */
export function SearchBar({ className, id = "site-search" }: { className?: string; id?: string }) {
  return (
    <Form action="/shop" className={cn("relative", className)} role="search">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search powders, slices, masalas…"
        className="w-full rounded-full border border-cream-200 bg-white py-2.5 pl-5 pr-12 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-forest-500"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-forest-700 text-white hover:bg-forest-900"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </Form>
  );
}
