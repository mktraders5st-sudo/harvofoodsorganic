-- The five Harvo categories (same ids as the website uses). Existing rows are left untouched.
insert into categories (id, name, sort_order) values
  ('vegetable-powders', 'Vegetable Powders',  1),
  ('fruit-powders',     'Fruit Powders',      2),
  ('spice-powders',     'Spice Powders',      3),
  ('dried-slices',      'Dried Fruit Slices', 4),
  ('seasonings',        'Seasoning & Blends', 5)
on conflict (id) do nothing;
