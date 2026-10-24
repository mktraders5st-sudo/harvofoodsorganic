# Deploying Harvo Foods Organic (Vercel + Supabase)

| Part | Where | Notes |
| --- | --- | --- |
| Website | **Vercel**, region `bom1` (Mumbai, set in `vercel.json`) | Builds from the GitHub repository |
| Database | **Supabase** PostgreSQL, project `wrwiuvdijwuvwwygkkyf`, region `ap-south-1` (Mumbai) | Same region as the website, so pages stay fast |

The website talks to the database only from its server, through `DATABASE_URL`. No database key is ever sent to the browser, and the Supabase `service_role` key is **not used at all**: don't add it anywhere.

> **Rules for the live database:** every command below that says **LIVE** needs `--prod` *and* `--confirm=wrwiuvdijwuvwwygkkyf`. Without both, the command stops before connecting. Always run the dry run (no `--apply`) first and read what it says.

---

## 1. Save the live database address on your computer

Already done if `.env.production.local` exists in `harvo-web`. Otherwise:

1. Supabase → your project → **Connect** → **Connection string** → **Transaction pooler**.
2. Copy it. It looks like `postgresql://postgres.wrwiuvdijwuvwwygkkyf:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`. Replace `[YOUR-PASSWORD]` with your database password.
3. Save it in `harvo-web/.env.production.local` as one line:
   ```
   DATABASE_URL="postgresql://postgres.wrwiuvdijwuvwwygkkyf:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
   ```

This file is Git-ignored: never commit it, paste it into chat, or share it. Only the `db:*` commands with `--prod` read it.

## 2. Create the tables in the live database (LIVE)

Look first. This is read-only: it runs inside a read-only transaction, so the database refuses any change:

```bash
npm run db:migrate -- --prod --confirm=wrwiuvdijwuvwwygkkyf
```

It should list `001_schema.sql`, `002_security.sql` and `003_categories.sql` as `pending`. Then run them:

```bash
npm run db:migrate -- --prod --apply --confirm=wrwiuvdijwuvwwygkkyf
```

What the migrations do:

| File | Does |
| --- | --- |
| `001_schema.sql` | Creates the tables (only if they don't exist yet; nothing is dropped) |
| `002_security.sql` | Turns on Row Level Security for every table and removes all access for Supabase's public API roles |
| `003_categories.sql` | Adds the 5 categories (existing ones are left alone) |

Each file runs in its own transaction and is recorded in `schema_migrations`, so it never runs twice. If one fails, nothing from that file is saved.

**Check:** Supabase → **Table Editor** shows the 9 tables, each marked RLS enabled. Running the dry run again says "Nothing to do".

## 3. Copy the products into the live database (LIVE)

This copies the 18 products, their 54 sizes, prices and stock (and any orders) from `data/harvo.db`. The SQLite file is opened read-only.

Look first (read-only, prints a table of what would be added):

```bash
npm run db:import -- --prod --confirm=wrwiuvdijwuvwwygkkyf
```

Then copy:

```bash
npm run db:import -- --prod --apply --confirm=wrwiuvdijwuvwwygkkyf
```

- Everything is copied in **one transaction**: either all of it is saved or none of it.
- Rows that already exist (same id) are **skipped, never overwritten**, so running it again is safe and adds nothing.
- At the end it compares every product and size with SQLite and prints `all match`, or lists any difference (for example a price you have already changed in the live admin).
- **Run it once, before the shop takes real orders.** Prices and stock you change later in the live admin are the ones that count; SQLite is only the starting point.

## 4. Put the code on the production branch

Vercel deploys the `main` branch as the live site. The Supabase version of the code is on the `supabase` branch, so it must be merged into `main` and pushed first (the current `main` still uses SQLite, which can't work on Vercel).

## 5. Create the Vercel project

1. Go to https://vercel.com, sign up with GitHub (Hobby plan is free).
2. **Add New → Project → Import** `mktraders5st-sudo/harvofoodsorganic`. The repository is private: when GitHub asks, give Vercel access to **only this repository**.
3. Framework: **Next.js** (detected). Root directory, build and install commands: leave the defaults.
4. Open **Environment Variables** before the first deploy and add:

   | Name | Value | Environments | Sensitive |
   | --- | --- | --- | --- |
   | `DATABASE_URL` | The Transaction pooler address from step 1 (port **6543**) | **Production only** | Yes |
   | `ADMIN_PASSWORD` | A new strong password, 12+ characters, not used anywhere else | **Production only** | Yes |

   Tick **Production** only, not Preview or Development. Vercel also builds a "preview" site for every other branch you push; keeping these Production-only means previews can never read or change live orders.

   Don't add `NODE_ENV` (Vercel sets it) or any `NEXT_PUBLIC_` variable for these: that prefix would send them to the browser.
5. **Settings → General → Node.js Version:** 22.x or 24.x.
6. Click **Deploy**.

## 6. Check the live site

- Open the `….vercel.app` address: home page and shop show the 18 products with their prices.
- `/admin` asks for the password, and `ADMIN_PASSWORD` gets you in.
- Place one test order (cash on delivery), see it in `/admin/orders`, then cancel it, which puts the stock back.

## 7. Your own domain

Vercel → project → **Settings → Domains → Add** `harvofoods.com`, then add the DNS records Vercel shows at your domain registrar. HTTPS is set up automatically. HTTPS is required: the admin sign-in cookie is only sent over secure connections.

## Updating the site later

- **Code changes:** push to `main`; Vercel builds and deploys automatically. If something breaks: Vercel → **Deployments** → pick the previous one → **Promote to Production** (instant rollback).
- **Database changes** (a new file in `db/migrations/`): run the LIVE migrate dry run, then `--apply` (step 2), **before** pushing the code that needs it.
- **Changing the database password** (Supabase → Database → Settings): update it in **both** `.env.production.local` and Vercel's `DATABASE_URL`, then redeploy.
- **Changing the admin password:** change `ADMIN_PASSWORD` in Vercel, then redeploy. Everyone signed in is signed out.

## Backups and limits (Supabase free plan)

- See Supabase → **Database → Backups** for what your plan includes. If there are no backups you can restore, export the `orders`, `order_items` and `products` tables now and then from **Table Editor → Export to CSV**.
- Free projects are **paused after a week with no activity**. A shop with visitors stays active, but if it pauses, restore it from the Supabase dashboard.
- The website uses at most 3 database connections per Vercel server, through the pooler, well inside the free limits.

## Checklist before going live

- [ ] `.env.production.local` saved and Git-ignored (`git status` doesn't list it)
- [ ] LIVE migrate dry run reviewed, then applied; Table Editor shows 9 tables with RLS enabled
- [ ] LIVE import dry run reviewed, then applied; it printed `all match`
- [ ] `supabase` branch merged into `main` and pushed
- [ ] Vercel: `DATABASE_URL` and `ADMIN_PASSWORD` set for **Production only**, marked Sensitive
- [ ] Real prices and stock set in `/admin/products`
- [ ] Example products reviewed (Mango, Banana and Orange Peel Powder, Mixed Herb Seasoning are examples)
- [ ] Social profile links added in `lib/data.ts` (`socialLinks`), if you have them
- [ ] Test order placed, seen in `/admin/orders`, then cancelled
