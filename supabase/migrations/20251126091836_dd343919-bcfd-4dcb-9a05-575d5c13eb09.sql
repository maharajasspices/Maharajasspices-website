-- Move Maharaja's powders to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE brand = 'Maharajas' 
AND (name ILIKE '%powder%' OR name ILIKE '%masala%' OR name ILIKE '%seasoning%');

-- Move Mother's Hand products to Pastes and Rubs
UPDATE products 
SET category = 'Pastes and Rubs'
WHERE brand = 'Mothers Hand';

-- Move seasonings and powders from Pastes and Rubs to Mixed Spices
UPDATE products 
SET category = 'Mixed Spices'
WHERE category = 'Pastes and Rubs' 
AND (name ILIKE '%powder%' OR name ILIKE '%seasoning%' OR name ILIKE '%masala%');

-- Move Pure Spices products to Condiments (except G-Force and vinegar)
UPDATE products 
SET category = 'Condiments'
WHERE category = 'Pure Spices' 
AND brand != 'G-Force'
AND name NOT ILIKE '%vinegar%';

-- Move G-Force products from Pure Spices to Sauces
UPDATE products 
SET category = 'Sauces'
WHERE category = 'Pure Spices' 
AND brand = 'G-Force';

-- Move vinegar products to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE name ILIKE '%vinegar%';

-- Move all G-Force products to Sauces
UPDATE products 
SET category = 'Sauces'
WHERE brand = 'G-Force';

-- Move Curry in a Hurry to new Cooking Sauce category
UPDATE products 
SET category = 'Cooking Sauce'
WHERE brand = 'Curry in a Hurry';