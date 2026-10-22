import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

export function Logo({
  light = false,
  alwaysShowText = false,
  className,
}: {
  light?: boolean;
  /** By default the wordmark hides on phones to save space. */
  alwaysShowText?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2.5", className)} aria-label="Harvo Foods Organic home">
      <span className="relative h-12 w-12 overflow-hidden rounded-full bg-white sm:h-14 sm:w-14">
        <Image src="/images/logo.png" alt="" fill sizes="56px" className="object-contain" priority />
      </span>
      <span className={cn("leading-none", alwaysShowText ? "block" : "hidden sm:block")}>
        <span className={cn("block font-serif text-xl font-bold tracking-wide", light ? "text-white" : "text-forest-900")}>
          HARVO
        </span>
        <span className={cn("mt-1 block text-[9px] font-semibold tracking-[0.25em]", light ? "text-forest-100" : "text-forest-700")}>
          FOODS · ORGANIC
        </span>
      </span>
    </Link>
  );
}
