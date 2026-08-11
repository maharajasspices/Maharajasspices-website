-- Fix image URLs by properly URL-encoding apostrophes in product names
UPDATE products 
SET images = ARRAY[REPLACE(images[1], 'Maharaja''s', 'Maharaja%27s')]
WHERE images[1] LIKE '%Maharaja''s%'
AND images[1] NOT LIKE '%Maharaja%27s%';