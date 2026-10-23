# Harvo Foods Organic: website

Next.js (App Router) + Tailwind CSS v4 + TypeScript + SQLite.

## Run it on your computer

**Needs:** Node.js 22 or newer (tested with 24.22.1). Check with `node --version`.

1. Open a terminal **in this folder** (`harvo-web`). On Windows: open the folder in File Explorer, click the address bar, type `powershell` and press Enter.
2. First time only, install packages:
   ```bash
   npm install
   ```
3. Start the site:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 for the shop and **http://localhost:3000/admin** for the admin panel: **no login is needed on your own computer**. Press `Ctrl + C` in the terminal to stop.

The database (`data/harvo.db`) is created automatically the first time the site runs, filled with the starting product list (stock: 50 packs per size).

> **Windows PowerShell says "running scripts is disabled"?** Type `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`), or use Command Prompt. It's the same npm.
>
> **`node` or `npm` "not recognized"?** Close and reopen the terminal (Node was added to your PATH after it was opened).

### All commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run for development on this computer only (reloads when you edit files; admin needs no login) |
| `npm run build` then `npm start` | Run the fast production version (admin needs `ADMIN_PASSWORD`, see below) |
| `npm run orders` | List the latest orders in the terminal |
| `npm run backup` | Save a safe copy of the database to `backups/` |

## Put it online

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions (Ubuntu VPS, PM2, Nginx, free HTTPS, daily backups, updates).

## Admin panel (`/admin`)

| Page | What you can do |
| --- | --- |
| Dashboard | New orders to confirm, orders today, sales this month, low-stock sizes |
| Orders | Search by order number, name or phone; filter by status |
| Order details | Customer, phone (call / WhatsApp), address, items, totals, status history, the customer's other orders. Move status: pending → confirmed → dispatched → delivered, or cancel |
| Products | Add products, edit details, show/hide in shop, feature on home page |
| Package sizes | Add any size (e.g. 500 g, 1 kg), set price and stock, take a size off sale, remove it |

Stock goes down automatically when an order is placed and goes back up if the order is cancelled. Customers can't order more than is in stock.

### Admin access

| Where | How you get in |
| --- | --- |
| **Your computer** (`npm run dev`, opened as `localhost`) | No login. A yellow "Local mode · no login" badge shows in the admin bar. |
| **The live website** | One admin password, set with the `ADMIN_PASSWORD` environment variable (12+ characters) in your hosting settings or the server's `.env.local`. |
| **Live website without `ADMIN_PASSWORD`** | Admin stays locked for everyone; the login page says it isn't set up. |

To change the live password, change `ADMIN_PASSWORD` and restart the site; everyone signed in is signed out.

### Security

- Password-free access only works when **all** of these are true: development mode (`npm run dev`), the site is opened as `localhost` / `127.0.0.1`, and the dev server only listens to this computer (`-H 127.0.0.1` in the `dev` script), so other devices on your Wi-Fi can't reach it. A deployed site runs in production mode, where this can never switch on.
- **Every admin page and every admin action checks access on the server** (`requireAdmin()` in `lib/server/auth.ts`).
- Live sign-in: a signed, httpOnly, SameSite=Strict cookie (Secure in production) that expires after 8 hours. No password is stored in the cookie or the database.
- Sign-in attempts are rate-limited (10 per 15 minutes per connection).
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

Needs a server with a persistent disk (a VPS), not serverless hosting like Vercel. Full steps in [DEPLOY.md](DEPLOY.md). Back up the database daily (`npm run backup`): it holds all orders and products.

## Still to do

- Add real product photos.
- Set real prices and stock in the admin panel.
- Connect the contact form and newsletter to real services.
- Confirm the email address (`harvoororganicfoods@gmail.com`, copied from the poster).
- Add your real social media profile links in `lib/data.ts` (`socialLinks`). They are hidden until set; the `@harvoororganicfoods` handle did not match live accounts.
