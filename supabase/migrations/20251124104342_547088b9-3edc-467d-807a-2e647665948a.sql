-- Insert the 7 missing products that were not included in the previous migration

INSERT INTO products (name, brand, price, category, images, description, weight, in_stock) VALUES
('Maharaja''s Cumin Powder 50g', 'Maharaja''s Spices', 20.99, 'Pure Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Cumin%20Powder%20-%2050g%2020.99.webp'], 'Pure cumin powder with earthy aroma. Essential spice for Indian and Mexican cuisine.', '50g', true),

('Maharaja''s Curry Powder Mild 50g', 'Maharaja''s Spices', 15.99, 'Mixed Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Curry%20Powder%20Mild%20-%2050g%2015.99.webp'], 'Mild curry powder for gentle flavor. Perfect for those new to curry or who prefer less heat.', '50g', true),

('Maharaja''s Curry Powder Hot 50g', 'Maharaja''s Spices', 15.99, 'Mixed Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Curry%20Powder%20Hot%20-%2050g%2015.99.webp'], 'Hot curry powder with intense spice. For those who love their curry with serious heat.', '50g', true),

('Maharaja''s Dhania (Coriander) Powder 50g', 'Maharaja''s Spices', 20.99, 'Pure Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Dhania%20(Coriander)%20Powder%20-%2050g%2020.99.webp'], 'Pure coriander (dhania) powder. Essential for curry bases and seasoning.', '50g', true),

('Maharaja''s Garam Masala 50g', 'Maharaja''s Spices', 20.99, 'Mixed Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Garam%20Masala%20-%2050g%2020.99.webp'], 'Authentic garam masala blend. The finishing touch for perfect Indian dishes.', '50g', true),

('Maharaja''s Jeera (Cumin) Whole 50g', 'Maharaja''s Spices', 20.99, 'Pure Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Jeera%20(Cumin)%20Whole%20-%2050g%2020.99.webp'], 'Whole cumin seeds (jeera) for tempering. Releases maximum flavor when heated in oil.', '50g', true),

('Maharaja''s Methi (Fenugreek) Leaves 15g', 'Maharaja''s Spices', 20.99, 'Pure Spices', ARRAY['https://dhafduzlhpartlvsgbqx.supabase.co/storage/v1/object/public/Maharajas-Basic-Products/basic-products/Maharaja''s%20Methi%20(Fenugreek)%20Leaves%20-%2015g%2020.99.webp'], 'Dried fenugreek leaves (kasuri methi). Adds unique aromatic flavor to curries.', '15g', true);