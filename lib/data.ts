// Catalogue content. Product names come from the Harvo flyer.
// Prices live in ./prices.ts. Ratings and items marked "(example)" are placeholders.

import { prices, type Grams, type PackPrices, type PricedProductId } from "./prices";

export { PACK_SIZES, type Grams } from "./prices";

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

export type Product = {
  id: PricedProductId;
  name: string;
  category: CategoryId;
  prices: PackPrices;
  /** Main colour of the product, used for its generated pack image. */
  color: string;
  /** Optional skin/rim colour for slices (e.g. red for apple). */
  rim?: string;
  /** Path to a real product photo in /public. When set, it replaces the generated image. */
  image?: string;
  rating: number;
  reviews: number;
  badge?: "Best Seller" | "New";
  featured?: boolean;
  description: string;
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

type ProductInput = Omit<Product, "prices">;

const productList: ProductInput[] = [
  // Powders
  { id: "onion-powder", name: "Onion Powder", category: "vegetable-powders", color: "#e8d6b5", rating: 5, reviews: 84, badge: "Best Seller", featured: true, description: "Sun-dried onions, finely ground for curries, marinades and dips." },
  { id: "tomato-powder", name: "Tomato Powder", category: "vegetable-powders", color: "#d8432f", rating: 5, reviews: 61, featured: true, description: "Rich tomato flavour for soups, gravies and sauces." },
  { id: "green-chilli-powder", name: "Green Chilli Powder", category: "vegetable-powders", color: "#5f9f35", rating: 4, reviews: 29, featured: true, description: "Fresh, sharp heat from dried green chillies." },
  { id: "beetroot-powder", name: "Beetroot Powder", category: "vegetable-powders", color: "#9b1d4c", rating: 4, reviews: 38, badge: "New", featured: true, description: "Natural colour and nutrition for smoothies and baking." },
  { id: "mint-powder", name: "Mint Powder", category: "spice-powders", color: "#4a9a56", rating: 4, reviews: 26, description: "Cool dried mint for raita, chutneys and drinks." },
  { id: "garlic-powder", name: "Garlic Powder", category: "vegetable-powders", color: "#efe5c8", rating: 5, reviews: 72, description: "Pure dehydrated garlic with no fillers." },
  { id: "ginger-powder", name: "Ginger Powder", category: "spice-powders", color: "#d6ae62", rating: 5, reviews: 57, description: "Warming dried ginger for tea, curries and baking." },
  { id: "coriander-powder", name: "Coriander Powder", category: "spice-powders", color: "#9c944b", rating: 5, reviews: 49, description: "Freshly ground coriander with a citrusy aroma." },

  // Fruit powders (example items: the flyer doesn't list any yet)
  { id: "mango-powder", name: "Mango Powder", category: "fruit-powders", color: "#f2ad35", rating: 5, reviews: 33, description: "Sweet ripe mango powder for shakes and desserts. (example)" },
  { id: "banana-powder", name: "Banana Powder", category: "fruit-powders", color: "#f0d98a", rating: 4, reviews: 18, description: "Naturally sweet banana powder for smoothies and baking. (example)" },
  { id: "orange-peel-powder", name: "Orange Peel Powder", category: "fruit-powders", color: "#ee8526", rating: 4, reviews: 14, description: "Zesty orange peel for baking and drinks. (example)" },

  // Dried fruit slices
  { id: "banana-slices", name: "Banana Slices", category: "dried-slices", color: "#f2d77c", rim: "#d8b04a", rating: 5, reviews: 45, featured: true, description: "Crispy dehydrated banana, no sugar added." },
  { id: "apple-slices", name: "Apple Slices", category: "dried-slices", color: "#f4e4b8", rim: "#c42d2d", rating: 5, reviews: 52, badge: "Best Seller", featured: true, description: "Light, crunchy apple rings, a perfect healthy snack." },
  { id: "orange-slices", name: "Orange Slices", category: "dried-slices", color: "#f29a3a", rim: "#d9671b", rating: 4, reviews: 21, description: "Tangy dried orange wheels for snacking and garnish." },
  { id: "mango-slices", name: "Mango Slices", category: "dried-slices", color: "#f6a92a", rim: "#e08a12", rating: 5, reviews: 39, featured: true, description: "Chewy, naturally sweet mango slices." },
  { id: "raw-mango-slices", name: "Raw Mango Slices", category: "dried-slices", color: "#c9cf6a", rim: "#7e9a2e", rating: 4, reviews: 17, description: "Sour raw mango slices, great with chat masala." },

  // Seasoning & blends
  { id: "chat-masala", name: "Chat Masala", category: "seasonings", color: "#b4552d", rating: 5, reviews: 93, badge: "Best Seller", featured: true, description: "Tangy, spicy blend for fruit chaat, salads and snacks." },
  { id: "mixed-herb-seasoning", name: "Mixed Herb Seasoning", category: "seasonings", color: "#6f8f3a", rating: 4, reviews: 12, badge: "New", description: "Dried herb blend for pasta, pizza and grills. (example)" },
];

export const products: Product[] = productList.map((p) => ({ ...p, prices: prices[p.id] }));

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

export { DELIVERY_FEE, FREE_DELIVERY_MIN } from "./pricing";

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

export function countInCategory(id: CategoryId) {
  return products.filter((p) => p.category === id).length;
}

export function startingPrice(product: Product) {
  return Math.min(...Object.values(product.prices));
}

export function priceFor(product: Product, grams: Grams) {
  return product.prices[grams];
}
