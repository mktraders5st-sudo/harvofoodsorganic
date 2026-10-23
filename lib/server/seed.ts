// Server-only: fills an empty database with the starting Harvo catalogue.
// Runs once. After that, products, prices, sizes and stock are managed in /admin.

import type Database from "better-sqlite3";
import type { Badge, CategoryId } from "../data";

type SeedProduct = {
  id: string;
  name: string;
  category: CategoryId;
  color: string;
  rim?: string;
  rating: number;
  reviews: number;
  badge?: Badge;
  featured?: boolean;
  description: string;
  /** Prices in PKR for the 50 g, 100 g and 250 g packs. */
  prices: [number, number, number];
};

const SIZES = [50, 100, 250] as const;
const STARTING_STOCK = 50;

const seedProducts: SeedProduct[] = [
  { id: "onion-powder", name: "Onion Powder", category: "vegetable-powders", color: "#e8d6b5", rating: 5, reviews: 84, badge: "Best Seller", featured: true, description: "Sun-dried onions, finely ground for curries, marinades and dips.", prices: [180, 320, 720] },
  { id: "tomato-powder", name: "Tomato Powder", category: "vegetable-powders", color: "#d8432f", rating: 5, reviews: 61, featured: true, description: "Rich tomato flavour for soups, gravies and sauces.", prices: [200, 360, 800] },
  { id: "green-chilli-powder", name: "Green Chilli Powder", category: "vegetable-powders", color: "#5f9f35", rating: 4, reviews: 29, featured: true, description: "Fresh, sharp heat from dried green chillies.", prices: [190, 340, 760] },
  { id: "beetroot-powder", name: "Beetroot Powder", category: "vegetable-powders", color: "#9b1d4c", rating: 4, reviews: 38, badge: "New", featured: true, description: "Natural colour and nutrition for smoothies and baking.", prices: [220, 400, 880] },
  { id: "mint-powder", name: "Mint Powder", category: "spice-powders", color: "#4a9a56", rating: 4, reviews: 26, description: "Cool dried mint for raita, chutneys and drinks.", prices: [190, 340, 760] },
  { id: "garlic-powder", name: "Garlic Powder", category: "vegetable-powders", color: "#efe5c8", rating: 5, reviews: 72, description: "Pure dehydrated garlic with no fillers.", prices: [200, 360, 800] },
  { id: "ginger-powder", name: "Ginger Powder", category: "spice-powders", color: "#d6ae62", rating: 5, reviews: 57, description: "Warming dried ginger for tea, curries and baking.", prices: [210, 380, 840] },
  { id: "coriander-powder", name: "Coriander Powder", category: "spice-powders", color: "#9c944b", rating: 5, reviews: 49, description: "Freshly ground coriander with a citrusy aroma.", prices: [160, 290, 640] },
  { id: "mango-powder", name: "Mango Powder", category: "fruit-powders", color: "#f2ad35", rating: 5, reviews: 33, description: "Sweet ripe mango powder for shakes and desserts. (example)", prices: [240, 430, 960] },
  { id: "banana-powder", name: "Banana Powder", category: "fruit-powders", color: "#f0d98a", rating: 4, reviews: 18, description: "Naturally sweet banana powder for smoothies and baking. (example)", prices: [220, 400, 880] },
  { id: "orange-peel-powder", name: "Orange Peel Powder", category: "fruit-powders", color: "#ee8526", rating: 4, reviews: 14, description: "Zesty orange peel for baking and drinks. (example)", prices: [210, 380, 840] },
  { id: "banana-slices", name: "Banana Slices", category: "dried-slices", color: "#f2d77c", rim: "#d8b04a", rating: 5, reviews: 45, featured: true, description: "Crispy dehydrated banana, no sugar added.", prices: [250, 450, 1000] },
  { id: "apple-slices", name: "Apple Slices", category: "dried-slices", color: "#f4e4b8", rim: "#c42d2d", rating: 5, reviews: 52, badge: "Best Seller", featured: true, description: "Light, crunchy apple rings, a perfect healthy snack.", prices: [280, 500, 1120] },
  { id: "orange-slices", name: "Orange Slices", category: "dried-slices", color: "#f29a3a", rim: "#d9671b", rating: 4, reviews: 21, description: "Tangy dried orange wheels for snacking and garnish.", prices: [260, 470, 1040] },
  { id: "mango-slices", name: "Mango Slices", category: "dried-slices", color: "#f6a92a", rim: "#e08a12", rating: 5, reviews: 39, featured: true, description: "Chewy, naturally sweet mango slices.", prices: [300, 540, 1200] },
  { id: "raw-mango-slices", name: "Raw Mango Slices", category: "dried-slices", color: "#c9cf6a", rim: "#7e9a2e", rating: 4, reviews: 17, description: "Sour raw mango slices, great with chat masala.", prices: [270, 490, 1080] },
  { id: "chat-masala", name: "Chat Masala", category: "seasonings", color: "#b4552d", rating: 5, reviews: 93, badge: "Best Seller", featured: true, description: "Tangy, spicy blend for fruit chaat, salads and snacks.", prices: [170, 310, 680] },
  { id: "mixed-herb-seasoning", name: "Mixed Herb Seasoning", category: "seasonings", color: "#6f8f3a", rating: 4, reviews: 12, badge: "New", description: "Dried herb blend for pasta, pizza and grills. (example)", prices: [230, 410, 920] },
];

export function seedCatalog(db: Database.Database) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (count > 0) return;

  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, category, description, color, rim, rating, reviews, badge, featured, sort_order)
     VALUES (@id, @name, @category, @description, @color, @rim, @rating, @reviews, @badge, @featured, @sortOrder)`,
  );
  const insertVariant = db.prepare(
    "INSERT INTO product_variants (product_id, grams, price, stock) VALUES (?, ?, ?, ?)",
  );

  db.transaction(() => {
    seedProducts.forEach((p, i) => {
      insertProduct.run({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        color: p.color,
        rim: p.rim ?? null,
        rating: p.rating,
        reviews: p.reviews,
        badge: p.badge ?? null,
        featured: p.featured ? 1 : 0,
        sortOrder: i,
      });
      SIZES.forEach((grams, j) => insertVariant.run(p.id, grams, p.prices[j], STARTING_STOCK));
    });
  })();
}
