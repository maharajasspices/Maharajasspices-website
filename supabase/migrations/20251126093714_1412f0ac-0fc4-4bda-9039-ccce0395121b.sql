-- Move lemon juices to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE LOWER(name) LIKE '%lemon juice%';

-- Move marinades from Sauces back to Marinades
UPDATE products 
SET category = 'Marinades'
WHERE LOWER(name) LIKE '%marinade%' AND category = 'Sauces';

-- Move Garlic and Herb Seasoning to Mixed Spices
UPDATE products 
SET category = 'Mixed Spices'
WHERE LOWER(name) LIKE '%garlic%herb%seasoning%';

-- Move Garlic Powder and Ginger Powder to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE (LOWER(name) LIKE '%garlic powder%' OR LOWER(name) LIKE '%ginger powder%');

-- Move Mixed Herbs to Mixed Spices
UPDATE products 
SET category = 'Mixed Spices'
WHERE LOWER(name) LIKE '%mixed herb%';

-- Move Cinnamon to Condiments
UPDATE products 
SET category = 'Condiments'
WHERE LOWER(name) LIKE '%cinnamon%' AND LOWER(name) NOT LIKE '%marinade%';

-- Ensure ALL Mother's Hand products are in Pastes & Rubs
UPDATE products 
SET category = 'Pastes & Rubs'
WHERE brand = 'Mother''s Hand';