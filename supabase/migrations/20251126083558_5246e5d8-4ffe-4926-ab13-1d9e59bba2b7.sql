-- Update Mother's Hand products to Pastes and Rubs category
UPDATE products
SET category = 'Pastes and Rubs'
WHERE brand = 'Mother''s Hand';

-- Update Maharaja's paste products to Pastes and Rubs category
UPDATE products
SET category = 'Pastes and Rubs'
WHERE brand = 'Maharaja''s' 
AND (
  LOWER(name) LIKE '%paste%' 
  OR LOWER(name) LIKE '%masala%'
  OR LOWER(name) LIKE '%rub%'
);