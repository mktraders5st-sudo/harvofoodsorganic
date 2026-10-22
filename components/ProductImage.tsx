import Image from "next/image";
import type { Product } from "@/lib/data";
import { cn } from "@/lib/format";

const GREEN = "#1b7a2e";
const DARK_GREEN = "#10501f";

/** Splits "Green Chilli Powder" into ["GREEN CHILLI", "POWDER"] for the pack label. */
function packLabel(product: Product): [string, string] {
  const match = product.name.match(/^(.*) (Powder|Slices)$/);
  if (match) return [match[1].toUpperCase(), match[2].toUpperCase()];
  return [product.name.toUpperCase(), product.category === "seasonings" ? "SEASONING" : "BLEND"];
}

// Fixed speckle positions so server and browser render identical SVG.
const speckles = [
  [-14, -8, 1.6], [6, -14, 1.2], [12, 4, 1.8], [-4, 10, 1.3], [-16, 6, 1.1],
  [16, -6, 1.2], [2, -2, 1.5], [-8, -16, 1], [9, 14, 1.1], [-12, 15, 0.9],
] as const;

function PowderTexture({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {speckles.map(([dx, dy, r], i) => (
        <circle
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          r={r}
          fill={i % 2 ? "#ffffff" : "#000000"}
          opacity={i % 2 ? 0.35 : 0.14}
        />
      ))}
    </g>
  );
}

function Slice({ cx, cy, r, color, rim }: { cx: number; cy: number; r: number; color: string; rim?: string }) {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={rim ?? color} />
      <circle cx={cx} cy={cy} r={r * 0.86} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#ffffff" opacity={0.22} />
      {spokes.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(a) * r * 0.8}
          y2={cy + Math.sin(a) * r * 0.8}
          stroke="#ffffff"
          strokeOpacity={0.65}
          strokeWidth={1}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.1} fill="#ffffff" opacity={0.8} />
    </g>
  );
}

/** Branded pack illustration generated from the product's colour. */
function PackIllustration({ product }: { product: Product }) {
  const { color, rim } = product;
  const isSlice = product.category === "dried-slices";
  const [main, sub] = packLabel(product);
  const mainSize = main.length > 11 ? 8 : 9.5;

  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" role="img" aria-label={`${product.name} pack`}>
      {/* Background */}
      <rect width="240" height="240" fill="#faf6ee" />
      <rect width="240" height="240" fill={color} opacity={0.16} />
      <circle cx="205" cy="35" r="70" fill={color} opacity={0.18} />
      <circle cx="20" cy="225" r="45" fill={GREEN} opacity={0.06} />

      {/* Pouch shadow */}
      <ellipse cx="105" cy="210" rx="54" ry="5" fill="#000" opacity={0.1} />

      {/* Pouch */}
      <path
        d="M58 52 Q58 44 66 44 H144 Q152 44 152 52 L158 198 Q158 207 149 207 H61 Q52 207 52 198 Z"
        fill="#ffffff"
        stroke="#e7dfcd"
        strokeWidth="1"
      />
      <path d="M58 62 V52 Q58 44 66 44 H144 Q152 44 152 52 V62 Z" fill={GREEN} />
      <line x1="62" y1="68" x2="148" y2="68" stroke="#e7dfcd" strokeWidth="1" strokeDasharray="3 2" />

      {/* Brand */}
      <path d="M100 76 q5 -9 13 -6 q-3 9 -13 6z" fill={GREEN} />
      <text x="105" y="91" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="14" fill={DARK_GREEN}>
        HARVO
      </text>
      <text x="105" y="99" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="5.5" letterSpacing="2" fill={GREEN}>
        ORGANIC
      </text>

      {/* Window showing the product */}
      <circle cx="105" cy="128" r="25" fill="#ffffff" stroke={GREEN} strokeWidth="1.5" />
      {isSlice ? (
        <Slice cx={105} cy={128} r={21} color={color} rim={rim} />
      ) : (
        <>
          <circle cx="105" cy="128" r="21" fill={color} />
          <PowderTexture cx={105} cy={128} />
        </>
      )}

      {/* Label */}
      <rect x="64" y="160" width="82" height="28" rx="5" fill={GREEN} />
      <text x="105" y="173" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize={mainSize} fill="#ffffff">
        {main}
      </text>
      <text x="105" y="182.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="6" letterSpacing="1.5" fill="#e1f1de">
        {sub}
      </text>
      <text x="105" y="198" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="5" fill="#5d675f">
        100% NATURAL · NO PRESERVATIVES
      </text>

      {/* Bowl of powder, or loose slices */}
      {isSlice ? (
        <>
          <Slice cx={178} cy={192} r={17} color={color} rim={rim} />
          <Slice cx={203} cy={180} r={13} color={color} rim={rim} />
          <Slice cx={200} cy={207} r={11} color={color} rim={rim} />
        </>
      ) : (
        <>
          <ellipse cx="188" cy="214" rx="30" ry="4" fill="#000" opacity={0.1} />
          <path d="M158 196 Q188 172 218 196 Z" fill={color} />
          <PowderTexture cx={188} cy={190} />
          <path d="M154 196 H222 Q218 216 188 216 Q158 216 154 196 Z" fill="#b5804c" />
          <path d="M154 196 H222" stroke="#cf9a63" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function ProductImage({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {product.image ? (
        <Image src={product.image} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
      ) : (
        <PackIllustration product={product} />
      )}
    </div>
  );
}
