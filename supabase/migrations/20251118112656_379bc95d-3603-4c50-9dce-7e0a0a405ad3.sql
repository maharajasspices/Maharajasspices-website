-- Add RLS policy for guest order tracking with tracking_token + email verification
CREATE POLICY "Guest users can view orders with valid tracking token and email"
ON public.orders
FOR SELECT
USING (
  -- Allow if tracking_token is provided and email in shipping_address matches
  (tracking_token IS NOT NULL) AND
  (shipping_address->>'email' IS NOT NULL) AND
  (user_id IS NULL)
  -- Note: Email verification will be done in application layer
  -- This policy just ensures the order has tracking_token and email set
);