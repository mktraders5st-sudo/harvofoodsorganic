# Harvo Foods Organic: website

Next.js (App Router) + Tailwind CSS v4 + TypeScript + SQLite.

## Run it on your computer

**Needs:** Node.js 22 or newer (tested with 24.22.1). Check with `node --version`.

1. Open a terminal **in this folder** (`harvo-web`). On Windows: open the folder in File Explorer, click the address bar, type `powershell` and press Enter.
2. First time only, install packages and create your admin login (the password is typed hidden, 12+ characters):
   ```bash
   npm install
   npm run admin:create -- yourname
   ```
3. Start the site:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 for the shop and http://localhost:3000/admin for the admin panel. Press `Ctrl + C` in the terminal to stop.

The database (`data/harvo.db`) is created automatically the first time the site runs, filled with the starting product list (stock: 50 packs per size).

> If `node` or `npm` is "not recognized", close and reopen the terminal (Node was added to your PATH after it was opened).

### All commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run for development (reloads when you edit files) |
| `npm run build` then `npm start` | Run the fast production version |
| `npm run admin:create -- name` | Create an admin, or reset an admin's password |
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

Needs a server with a persistent disk (a VPS), not serverless hosting like Vercel. Full steps in [DEPLOY.md](DEPLOY.md). Back up the database daily (`npm run backup`): it holds all orders and products.

## Still to do

- Add real product photos.
- Set real prices and stock in the admin panel.
- Connect the contact form and newsletter to real services.
- Confirm the email address (`harvoororganicfoods@gmail.com`, copied from the poster).
- Add your real social media profile links in `lib/data.ts` (`socialLinks`). They are hidden until set; the `@harvoororganicfoods` handle did not match live accounts.
