-- Revert URL encoding - use actual apostrophe character to match bucket files
UPDATE products 
SET images = ARRAY[REPLACE(images[1], 'Maharaja%27s', 'Maharaja''s')]
WHERE images[1] LIKE '%Maharaja%27s%';