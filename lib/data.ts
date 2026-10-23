// Shared catalogue types and static site content.
// Products, prices, package sizes and stock live in the database and are managed in /admin.

export type CategoryId =
  | "vegetable-powders"
  | "fruit-powders"
  | "spice-powders"
  | "dried-slices"
  | "seasonings";

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  image: string;
  tint: string;
};

/** A package size of a product, with its own price (PKR) and stock. */
export type Variant = {
  id: number;
  grams: number;
  price: number;
  stock: number;
  active: boolean;
};

export type Badge = "Best Seller" | "New";

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  /** Main colour of the product, used for its generated pack image. */
  color: string;
  /** Optional skin/rim colour for slices (e.g. red for apple). */
  rim?: string;
  /** Path to a real product photo in /public. When set, it replaces the generated image. */
  image?: string;
  rating: number;
  reviews: number;
  badge?: Badge;
  featured: boolean;
  active: boolean;
  variants: Variant[];
};

export type Recipe = {
  id: string;
  title: string;
  excerpt: string;
  minutes: number;
  serves: number;
  difficulty: "Easy" | "Medium" | "Hard";
  tag: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Drinks";
  ingredients: string[];
};

export const categories: Category[] = [
  {
    id: "vegetable-powders",
    name: "Vegetable Powders",
    blurb: "Onion, tomato, beetroot & more",
    image: "/images/cat-vegetable-powders.jpg",
    tint: "from-forest-100 to-forest-50",
  },
  {
    id: "fruit-powders",
    name: "Fruit Powders",
    blurb: "Mango, banana & orange",
    image: "/images/cat-fruit-powders.jpg",
    tint: "from-tomato-100 to-cream-100",
  },
  {
    id: "spice-powders",
    name: "Spice Powders",
    blurb: "Ginger, coriander, mint & more",
    image: "/images/cat-spice-powders.jpg",
    tint: "from-cream-300 to-tomato-50",
  },
  {
    id: "dried-slices",
    name: "Dried Fruit Slices",
    blurb: "Crunchy, naturally sweet snacks",
    image: "/images/cat-dried-slices.jpg",
    tint: "from-cream-200 to-cream-100",
  },
  {
    id: "seasonings",
    name: "Seasoning & Blends",
    blurb: "Chat masala & signature mixes",
    image: "/images/cat-seasonings.jpg",
    tint: "from-forest-100 to-cream-200",
  },
];

export const CATEGORY_IDS = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export const recipes: Recipe[] = [
  { id: "fruit-chaat", title: "Tangy Fruit Chaat", excerpt: "Fresh fruit tossed with Harvo chat masala and a squeeze of lemon.", minutes: 10, serves: 4, difficulty: "Easy", tag: "Snack", ingredients: ["chat-masala", "apple-slices"] },
  { id: "tomato-soup", title: "Quick Tomato Garlic Soup", excerpt: "A comforting soup made in minutes with tomato and garlic powder.", minutes: 20, serves: 3, difficulty: "Easy", tag: "Dinner", ingredients: ["tomato-powder", "garlic-powder", "onion-powder"] },
  { id: "mango-shake", title: "Mango Banana Shake", excerpt: "Creamy, naturally sweet shake with no added sugar.", minutes: 5, serves: 2, difficulty: "Easy", tag: "Drinks", ingredients: ["mango-slices", "banana-slices"] },
  { id: "mint-raita", title: "Cooling Mint Raita", excerpt: "Yogurt, cucumber and mint powder, the perfect side for biryani.", minutes: 10, serves: 4, difficulty: "Easy", tag: "Lunch", ingredients: ["mint-powder", "coriander-powder"] },
  { id: "ginger-chai", title: "Ginger Doodh Chai", excerpt: "Warming milky chai with a spoon of Harvo ginger powder.", minutes: 10, serves: 2, difficulty: "Easy", tag: "Breakfast", ingredients: ["ginger-powder"] },
  { id: "beet-paratha", title: "Pink Beetroot Paratha", excerpt: "Soft, colourful parathas kids love, with hidden veggies.", minutes: 35, serves: 4, difficulty: "Medium", tag: "Breakfast", ingredients: ["beetroot-powder", "onion-powder"] },
];

export const testimonials = [
  { name: "Customer Name", city: "Karachi", quote: "Customer review goes here, a short quote about product quality and freshness." },
  { name: "Customer Name", city: "Lahore", quote: "Customer review goes here, a short quote about taste and packaging." },
  { name: "Customer Name", city: "Islamabad", quote: "Customer review goes here, a short quote about delivery and service." },
];

export const contactInfo = {
  phone: "0371-3413950",
  whatsapp: "0092 371 3413950",
  whatsappLink: "https://wa.me/923713413950",
  address: "368/A Gulshan-e-Iqbal, Block 5, Karachi",
  email: "harvoororganicfoods@gmail.com",
  social: "@harvoororganicfoods",
};

/**
 * Social media profile links shown in the footer. Paste the full address of each profile
 * (e.g. "https://www.instagram.com/yourpage"). Empty ones are hidden.
 * None are set yet: the @harvoororganicfoods handle on the poster doesn't match a live
 * Instagram, Facebook, TikTok or Threads account (checked Oct 2026).
 */
export const socialLinks = {
  instagram: "",
  facebook: "",
  tiktok: "",
  threads: "",
};

export { DELIVERY_FEE, FREE_DELIVERY_MIN } from "./pricing";

/** Show at or below this many packs as "Only N left". */
export const LOW_STOCK = 5;

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id) ?? categories[0];
}

export function startingPrice(product: Product) {
  const prices = product.variants.map((v) => v.price);
  return prices.length ? Math.min(...prices) : 0;
}

export function inStock(product: Product) {
  return product.variants.some((v) => v.stock > 0);
}

/** 250 → "250g", 1000 → "1kg", 1500 → "1.5kg" */
export function formatGrams(grams: number) {
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`;
}

export function countByCategory(products: Product[]) {
  const counts = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<CategoryId, number>;
  for (const p of products) counts[p.category]++;
  return counts;
}
