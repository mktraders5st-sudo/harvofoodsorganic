# Harvo Foods Organic: website

Next.js (App Router) + Tailwind CSS v4 + TypeScript + SQLite.

## Run it

```bash
npm install
npm run admin:create -- yourname   # first time only: create your admin login
npm run dev
```

- Shop: http://localhost:3000
- Admin: http://localhost:3000/admin

The database (`data/harvo.db`) is created automatically and filled with the starting product list the first time the site runs.

## Admin panel (`/admin`)

| Page | What you can do |
| --- | --- |
| Dashboard | New orders to confirm, orders today, sales this month, low-stock sizes |
| Orders | Search by order number, name or phone; filter by status |
| Order details | Customer, phone (call / WhatsApp), address, items, totals, status history, the customer's other orders. Move status: pending → confirmed → dispatched → delivered, or cancel |
| Products | Add products, edit details, show/hide in shop, feature on home page |
| Package sizes | Add any size (e.g. 500 g, 1 kg), set price and stock, take a size off sale, remove it |

Stock goes down automatically when an order is placed and goes back up if the order is cancelled. Customers can't order more than is in stock.

### Admin accounts

```bash
npm run admin:create -- yourname
```

Creates the account, or sets a new password if it already exists (this also signs that account out everywhere). Passwords must be at least 12 characters and are typed hidden.

### Security

- Passwords are hashed with scrypt (random salt); plain passwords are never stored.
- Sessions: random 256-bit token in an httpOnly, SameSite=Strict cookie (Secure in production); only its SHA-256 hash is stored. Sessions expire after 8 hours.
- **Every admin page and every admin action checks the session on the server** (`requireAdmin()` in `lib/server/auth.ts`).
- 5 wrong passwords lock the account for 15 minutes; sign-in attempts are also rate-limited per connection.
- All admin input is validated on the server (zod); all database queries are parameterised.
- Admin pages are not indexed by search engines and are sent with `Cache-Control: no-store`.

## Checkout & orders

- Customers check out at `/checkout`: name, mobile, optional email, city, address, notes. **Cash on delivery only**: no card, bank or payment details are collected or stored.
- The server ignores prices sent by the browser and uses the prices and stock in the database.
- Double-clicks can't create duplicate orders; a hidden spam trap and rate limit block bots.
- Quick look from the terminal: `npm run orders`.

## Where things live

| What | Where |
| --- | --- |
| Shop pages | `app/(store)/` |
| Admin pages | `app/admin/` |
| Database structure | `db/migrations/*.sql` (applied automatically, in order) |
| Starting product list | `lib/server/seed.ts` (used only when the database is empty) |
| Categories, recipes, contact details | `lib/data.ts` |
| Delivery fee & free-delivery amount | `lib/pricing.ts` |
| Brand colours | `app/globals.css` (`forest` = green, `cream`, `tomato` = red) |
| Product images | Generated pack images (`components/ProductImage.tsx`), or set a photo path per product in the admin |

## Hosting

SQLite needs a server with a persistent disk (a VPS or a Node host). On serverless hosts such as Vercel, move to a hosted database (e.g. Postgres or Turso). Back up `data/harvo.db` regularly: it holds all orders and products. Always serve the site over HTTPS.

## Still to do

- Add real product photos.
- Set real prices and stock in the admin panel.
- Connect the contact form and newsletter to real services.
- Confirm the email address and social links (built from `@harvoororganicfoods`).
