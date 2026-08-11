-- Mark the duplicate order as cancelled
UPDATE public.orders 
SET status = 'cancelled' 
WHERE id = '3e2ed5f1-558a-4316-a287-4f7677a46dd9';