# Harvo Foods Organic: website

Next.js (App Router) + Tailwind CSS v4 + TypeScript + PostgreSQL (Supabase when live).

## Run it on your computer

**Needs:** Node.js 22 or newer (tested with 24.22.1). Check with `node --version`.

On your computer the site uses a **local development database** (PGlite, PostgreSQL 17) that runs on this computer only, at `127.0.0.1:5433`. It never touches the live Supabase database.

> **Windows PowerShell says "running scripts is disabled"?** Type `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`), or use Command Prompt. It's the same npm.
>
> **`node` or `npm` "not recognized"?** Close and reopen the terminal (Node was added to your PATH after it was opened).

### First time only

Open a terminal **in this folder** (`harvo-web`). On Windows: open the folder in File Explorer, click the address bar, type `powershell` and press Enter.

1. Install the website's packages, then the local database's packages:
   ```bash
   npm install
   ```
   ```bash
   npm --prefix tools/local-db ci --omit=peer
   ```
2. Check `.env.local` exists and points at the local database (it is never committed to Git):
   ```
   DATABASE_URL="postgresql://postgres:local-dev@127.0.0.1:5433/postgres"
   ```
3. In a **second** terminal, start the local database and leave it running:
   ```bash
   npm run db:local
   ```
4. Back in the first terminal, create the tables, then copy the products from the old SQLite file (`data/harvo.db`, read-only). Each command first shows what it *would* do; add `--apply` to do it:
   ```bash
   npm run db:migrate
   ```
   ```bash
   npm run db:migrate -- --apply
   ```
   ```bash
   npm run db:import
   ```
   ```bash
   npm run db:import -- --apply
   ```
   Both are safe to run again: finished migrations are skipped, and rows that already exist are never changed.

### Every day

1. Terminal 1: `npm run db:local` (the local database; stop with `Ctrl + C`).
2. Terminal 2: `npm run dev` (the website).
3. Open http://localhost:3000 for the shop and **http://localhost:3000/admin** for the admin panel: **no login is needed on your own computer**.

The local test data (orders, price changes) is kept in `tools/local-db/data/`, which Git ignores.

**Local database differences:** PGlite accepts **one connection at a time**. While `npm run dev` is using it, another tool (such as `npm run orders`) may be refused for up to 20 seconds; wait and try again. Supabase has no such limit.

### All commands

| Command | What it does |
| --- | --- |
| `npm run db:local` | Start the local development database (this computer only) |
| `npm run dev` | Run the site for development (reloads when you edit files; admin needs no login) |
| `npm run build` then `npm start` | Run the production version locally. **Careful:** this mode also reads `.env.production.local` (the LIVE database). Only run it as `$env:DATABASE_URL="postgresql://postgres:local-dev@127.0.0.1:5433/postgres"; npm.cmd run build` so it uses the local one. |
| `npm run db:migrate` | Show which database changes are pending (read-only). Add `-- --apply` to run them |
| `npm run db:import` | Show what would be copied from SQLite (read-only). Add `-- --apply` to copy |
| `npm run orders` | List the latest orders in the terminal |

The `db:*` and `orders` commands use the **local/development** database from `.env.local`. They only touch the live database with `--prod` **and** `--confirm=<project-id>`; see [DEPLOY.md](DEPLOY.md).

## Put it online

The live site runs on **Vercel**, with its data in **Supabase** (PostgreSQL). See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions.

## Admin panel (`/admin`)

| Page | What you can do |
| --- | --- |
| Dashboard | New orders to confirm, orders today, sales this month, low-stock sizes |
| Orders | Search by order number, name or phone; filter by status |
| Order details | Customer, phone (call / WhatsApp), address, items, totals, status history, the customer's other orders. Move status: pending → confirmed → dispatched → delivered, or cancel |
| Products | Add products, edit details, show/hide in shop, feature on home page, set a photo |
| Package sizes | Add any size (e.g. 500 g, 1 kg), set price and stock, take a size off sale, remove it |

Stock goes down automatically when an order is placed and goes back up if the order is cancelled. Customers can't order more than is in stock, even if two people check out at once.

### Admin access

| Where | How you get in |
| --- | --- |
| **Your computer** (`npm run dev`, opened as `localhost`) | No login. A yellow "Local mode · no login" badge shows in the admin bar. |
| **The live website** | One admin password, set with the `ADMIN_PASSWORD` environment variable (12+ characters) in Vercel. |
| **Live website without `ADMIN_PASSWORD`** | Admin stays locked for everyone; the login page says it isn't set up. |

To change the live password, change `ADMIN_PASSWORD` in Vercel and redeploy; everyone signed in is signed out.

### Security

- Password-free access only works when **all** of these are true: development mode (`npm run dev`), the site is opened as `localhost` / `127.0.0.1`, and the dev server only listens to this computer (`-H 127.0.0.1` in the `dev` script). A deployed site runs in production mode, where this can never switch on.
- **Every admin page and every admin action checks access on the server** (`requireAdmin()` in `lib/server/auth.ts`).
- Live sign-in: a signed, httpOnly, SameSite=Strict, Secure cookie that expires after 8 hours. No password is stored in the cookie or the database.
- Sign-in and checkout attempts are rate-limited, with the counts kept in the database so they hold across all Vercel servers.
- All input is validated on the server (zod); all database queries are parameterised.
- The database is only reached from the server (`DATABASE_URL`, never sent to the browser). In Supabase, Row Level Security is on for every table with no policies, and the public API roles (`anon`, `authenticated`) have no access, so nobody can read orders or change prices through Supabase's public API.
- Admin pages are not indexed by search engines and are sent with `Cache-Control: no-store`.

## Checkout & orders

- Customers check out at `/checkout`: name, mobile, optional email, city, address, notes. **Cash on delivery only**: no card, bank or payment details are collected or stored.
- The server ignores prices sent by the browser and uses the prices and stock in the database.
- Double-clicks can't create duplicate orders; a hidden spam trap and rate limit block bots.

## Where things live

| What | Where |
| --- | --- |
| Shop pages | `app/(store)/` |
| Admin pages | `app/admin/` |
| Database structure | `db/migrations/*.sql` (run with `npm run db:migrate`, in name order, each once) |
| Database connection | `lib/server/db.ts` (website), `scripts/db-env.mjs` (`db:*` commands) |
| Old SQLite data (source for the import) | `data/harvo.db` (read-only, Git-ignored) |
| Local development database | `tools/local-db/` (data in `tools/local-db/data/`, Git-ignored) |
| Categories, recipes, contact details | `lib/data.ts` |
| Delivery fee & free-delivery amount | `lib/pricing.ts` |
| Brand colours | `app/globals.css` (`forest` = green, `cream`, `tomato` = red) |
| Product images | Generated pack images (`components/ProductImage.tsx`), or set a photo path per product in the admin |

## Settings files (never committed)

| File | Used for |
| --- | --- |
| `.env.local` | Your computer: the **local** database (`npm run dev`, `db:*` commands) |
| `.env.production.local` | Your computer: the **LIVE** Supabase address, used only by `db:*` commands with `--prod --confirm=…` |
| Vercel → Environment Variables | The live website: `DATABASE_URL`, `ADMIN_PASSWORD` |

`.env.example` shows the format without any real values.

## Still to do

- Add real product photos.
- Set real prices and stock in the admin panel.
- Connect the contact form and newsletter to real services.
- Confirm the email address (`harvoororganicfoods@gmail.com`, copied from the poster).
- Add your real social media profile links in `lib/data.ts` (`socialLinks`). They are hidden until set; the `@harvoororganicfoods` handle did not match live accounts.
