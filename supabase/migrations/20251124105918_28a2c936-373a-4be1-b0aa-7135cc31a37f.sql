-- Delete all products that were incorrectly added in recent migrations
-- Keep only products that existed before the migration attempts
DELETE FROM products 
WHERE created_at >= '2025-11-24 10:43:00';