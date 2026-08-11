-- Fix product name spellings and move products to Whole Spices category

-- Grains fixes: "Pea Dhall" -> "Pea Dhall" (ensure two words), "Sugar Beans" -> "Sugar Beans" (ensure two words)
UPDATE products SET name = REPLACE(name, 'PeaDhall', 'Pea Dhall') WHERE name ILIKE '%peadhall%';
UPDATE products SET name = REPLACE(name, 'Peadhall', 'Pea Dhall') WHERE name ILIKE '%peadhall%';
UPDATE products SET name = REPLACE(name, 'SugarBeans', 'Sugar Beans') WHERE name ILIKE '%sugarbeans%';

-- Spices fixes
UPDATE products SET name = REPLACE(name, 'Somph', 'Soomph') WHERE name ILIKE '%somph%' AND name NOT ILIKE '%soomph%';
UPDATE products SET name = REPLACE(name, 'Tumeric', 'Turmeric') WHERE name ILIKE '%tumeric%';
UPDATE products SET name = REPLACE(name, 'Chillie', 'Chilli') WHERE name ILIKE '%kashmiri%chillie%';

-- Move products to Whole Spices category
UPDATE products SET category = 'Whole Spices' WHERE name ILIKE '%bay leaves%';
UPDATE products SET category = 'Whole Spices' WHERE name ILIKE '%breyani mix whole%';
UPDATE products SET category = 'Whole Spices' WHERE name ILIKE '%cloves%';