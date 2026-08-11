-- Drop the existing complex INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders with valid shipping info" ON public.orders;

-- Create a simpler, more permissive INSERT policy that works for both guests and authenticated users
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Must have valid shipping info
  shipping_address IS NOT NULL
  AND (shipping_address ->> 'fullName') IS NOT NULL
  AND (shipping_address ->> 'address') IS NOT NULL
  AND (shipping_address ->> 'city') IS NOT NULL
  AND (shipping_address ->> 'email') IS NOT NULL
  AND (shipping_address ->> 'phone') IS NOT NULL
  AND length(shipping_address ->> 'fullName') >= 2
  AND length(shipping_address ->> 'address') >= 5
  AND length(shipping_address ->> 'email') >= 5
  AND length(shipping_address ->> 'phone') >= 10
  -- User ID must match auth or be null for guests
  AND (
    user_id IS NULL 
    OR user_id = auth.uid()
  )
);