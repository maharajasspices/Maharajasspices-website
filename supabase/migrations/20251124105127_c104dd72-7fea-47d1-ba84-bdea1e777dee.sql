-- Delete duplicate products with URL-encoded apostrophes that were incorrectly added
DELETE FROM products WHERE id IN (
  'cce19f3f-9956-459d-8dce-b52b21b22798',
  '4802d7a7-ef0c-4170-bbaa-28008bc6c229',
  '01a25e53-f176-44e5-a862-6709ee3db8db'
);