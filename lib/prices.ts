/**
 * ─────────────────────────────────────────────
 *  HARVO PRICE LIST  (Pakistani Rupees, PKR)
 * ─────────────────────────────────────────────
 *  Change any number below and save. The new price shows
 *  everywhere on the site: product cards, shop and cart.
 *
 *  Each product has a price for the 50 g, 100 g and 250 g pack.
 *  These are example prices. Replace them with your real ones.
 */

export const PACK_SIZES = [50, 100, 250] as const;
export type Grams = (typeof PACK_SIZES)[number];
export type PackPrices = Record<Grams, number>;

export const prices = {
  // ── Vegetable & spice powders ──────────────── 50 g   100 g   250 g
  "onion-powder":         { 50: 180, 100: 320, 250: 720 },
  "tomato-powder":        { 50: 200, 100: 360, 250: 800 },
  "green-chilli-powder":  { 50: 190, 100: 340, 250: 760 },
  "beetroot-powder":      { 50: 220, 100: 400, 250: 880 },
  "mint-powder":          { 50: 190, 100: 340, 250: 760 },
  "garlic-powder":        { 50: 200, 100: 360, 250: 800 },
  "ginger-powder":        { 50: 210, 100: 380, 250: 840 },
  "coriander-powder":     { 50: 160, 100: 290, 250: 640 },

  // ── Fruit powders (example items) ─────────────
  "mango-powder":         { 50: 240, 100: 430, 250: 960 },
  "banana-powder":        { 50: 220, 100: 400, 250: 880 },
  "orange-peel-powder":   { 50: 210, 100: 380, 250: 840 },

  // ── Dried fruit slices ────────────────────────
  "banana-slices":        { 50: 250, 100: 450, 250: 1000 },
  "apple-slices":         { 50: 280, 100: 500, 250: 1120 },
  "orange-slices":        { 50: 260, 100: 470, 250: 1040 },
  "mango-slices":         { 50: 300, 100: 540, 250: 1200 },
  "raw-mango-slices":     { 50: 270, 100: 490, 250: 1080 },

  // ── Seasoning & blends ────────────────────────
  "chat-masala":          { 50: 170, 100: 310, 250: 680 },
  "mixed-herb-seasoning": { 50: 230, 100: 410, 250: 920 },
} satisfies Record<string, PackPrices>;

export type PricedProductId = keyof typeof prices;
