-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.product_ratings;

CREATE VIEW public.product_ratings AS
SELECT 
  product_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.product_reviews
GROUP BY product_id;