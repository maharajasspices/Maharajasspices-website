-- Fix all product name spellings with exact matches

-- Fix "sugarbeans" to "Sugar Beans"
UPDATE products SET name = REGEXP_REPLACE(name, 'sugarbeans', 'Sugar Beans', 'i') WHERE name ILIKE '%sugarbeans%';

-- Fix "somph" to "soomph" (but not if already soomph)
UPDATE products SET name = REGEXP_REPLACE(name, 'somph', 'soomph', 'i') WHERE name ILIKE '%somph%' AND name NOT ILIKE '%soomph%';

-- Fix "tumeric" to "turmeric" everywhere
UPDATE products SET name = REGEXP_REPLACE(name, 'tumeric', 'turmeric', 'gi') WHERE name ILIKE '%tumeric%';

-- Fix "chillie" to "chilli" (remove trailing e)
UPDATE products SET name = REGEXP_REPLACE(name, 'chillie', 'chilli', 'gi') WHERE name ILIKE '%chillie%';