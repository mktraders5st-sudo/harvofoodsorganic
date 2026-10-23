-- Lock every table down. The website reads and writes only from its server, using the
-- DATABASE_URL connection (the table owner). Supabase's public API roles ("anon" for visitors,
-- "authenticated" for logged-in API users) get NO access to any of this data.
--
-- Row Level Security is switched on with no policies, so the public API can't read or change
-- a single row (customers can't see other customers' orders, or change prices and stock).
-- The table owner used by the website is not affected by RLS.

alter table categories           enable row level security;
alter table products             enable row level security;
alter table product_images       enable row level security;
alter table product_variants     enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;
alter table rate_limits          enable row level security;
alter table schema_migrations    enable row level security;

-- Supabase grants new tables to the public API roles by default; take those grants away.
revoke all on table
  categories, products, product_images, product_variants,
  orders, order_items, order_status_history, rate_limits, schema_migrations
from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tables created later in this schema start private too.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
