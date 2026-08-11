-- Fix variant products that are missing weight labels
-- Peadhall: 500g and 1kg based on price
UPDATE products 
SET variants = '[{"weight": "500g", "price": 13.99}, {"weight": "1kg", "price": 27.99}]'::jsonb
WHERE id = '75697f74-47cf-4b76-adc5-d2dc27af98ec';

-- Nuts: 250g and 500g based on price
UPDATE products 
SET variants = '[{"weight": "250g", "price": 32.99}, {"weight": "500g", "price": 58.99}]'::jsonb
WHERE id = '81c437ca-3927-4a1e-9ee7-469588c5b69b';

-- Sugarbeans: 500g and 1kg based on price
UPDATE products 
SET variants = '[{"weight": "500g", "price": 33.99}, {"weight": "1kg", "price": 63.99}]'::jsonb
WHERE id = 'c8bc72e7-65eb-4893-ae3c-8c8f578d2302';

-- Popcorn: 500g and 1kg based on price
UPDATE products 
SET variants = '[{"weight": "500g", "price": 16.99}, {"weight": "1kg", "price": 30.99}]'::jsonb
WHERE id = '98c36df2-0c9d-4417-929c-efb14bdf87a8';

-- Masoor Dhall: 500g and 1kg based on price
UPDATE products 
SET variants = '[{"weight": "500g", "price": 23.99}, {"weight": "1kg", "price": 45.99}]'::jsonb
WHERE id = 'bba650db-7315-4e75-858c-c26394c1c73a';

-- Move all Mixed Spices products to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE category = 'Mixed Spices';

-- Rename Pure Spices to Spices
UPDATE products 
SET category = 'Spices'
WHERE category = 'Pure Spices';