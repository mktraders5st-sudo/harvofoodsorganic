# Harvo Foods Organic: website

Next.js (App Router) + Tailwind CSS v4 + TypeScript.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pages

| Route      | File                    |
| ---------- | ----------------------- |
| `/`        | `app/page.tsx`          |
| `/shop`    | `app/shop/page.tsx`     |
| `/about`   | `app/about/page.tsx`    |
| `/recipes` | `app/recipes/page.tsx`  |
| `/contact` | `app/contact/page.tsx`  |
| `/cart`    | `app/cart/page.tsx`     |

## Where things live

- **Brand colours**: `app/globals.css` (`forest` = green, `cream`, `tomato` = red). Change a hex value there and it updates everywhere.
- **Prices (PKR)**: `lib/prices.ts`. One line per product with its 50 g, 100 g and 250 g price. Edit a number and save.
- **Product images**: generated Harvo pack images (`components/ProductImage.tsx`). To use a real photo, put it in `public/images/products/` and add `image: "/images/products/onion.jpg"` to that product in `lib/data.ts`.
- **Products, categories, recipes, contact details**: `lib/data.ts`. Product names, pack sizes (50/100/250 g) and contact details come from the Harvo flyer and poster. Prices, ratings, and items marked "(placeholder)" are examples.
- **Images**: `public/images/` holds the logo and category photos (cropped from the Harvo poster and flyer). Replace them with full-size photos when available, keeping the same file names.
- **Cart state**: `lib/cart-context.tsx` (saved in the browser with localStorage).
- **Reusable UI**: `components/ui.tsx` (Container, Section, ButtonLink, SectionHeading, PageHero, ImagePlaceholder, Rating), `components/cards.tsx` (ProductCard, CategoryCard, RecipeCard).

## Checkout & orders

- Customers check out at `/checkout` with name, mobile, optional email, city, address and notes. Payment is **cash on delivery only**: no card, bank or payment details are collected or stored.
- Orders are saved to a SQLite database at `data/harvo.db` (created automatically, git-ignored). Tables: `orders` and `order_items`.
- See the latest orders: `npm run orders` (or `npm run orders -- 50`).

Security measures:
- Every field is validated in the browser and again on the server (`lib/checkout-schema.ts`).
- The server ignores prices sent by the browser and recalculates every price and total from `lib/prices.ts`.
- All database writes use parameterised queries inside a transaction.
- Double-clicks and retries can't create duplicate orders (one-time checkout key).
- Hidden spam-trap field, plus a limit of 5 orders per connection every 10 minutes.
- Orders are submitted through a Next.js Server Action, which rejects requests from other websites.
- Security headers in `next.config.ts`; the checkout page is hidden from search engines.

Hosting note: SQLite needs a server with a persistent disk (a VPS or a Node host). On serverless hosts such as Vercel, switch `lib/server/db.ts` to a hosted database (e.g. Postgres or Turso).

## Still to do

- Add real product photos (optional; generated pack images are used until then).
- Set real prices in `lib/prices.ts`.
- Confirm the email address and social links (built from `@harvoororganicfoods`).
- Connect the contact form and newsletter to real services.
- Add a password-protected admin page to view orders and update their status.
