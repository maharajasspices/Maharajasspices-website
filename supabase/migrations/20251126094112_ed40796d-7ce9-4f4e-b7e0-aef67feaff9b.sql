-- Move popcorn seasoning salt and vinegar to Mixed Spices
UPDATE products 
SET category = 'Mixed Spices'
WHERE LOWER(name) LIKE '%popcorn%seasoning%salt%vinegar%'
   OR LOWER(name) LIKE '%popcorn%salt%vinegar%';