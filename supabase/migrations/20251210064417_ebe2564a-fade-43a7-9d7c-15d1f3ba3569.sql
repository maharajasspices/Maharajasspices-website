-- Drop the existing restrictive policy that blocks guest orders
DROP POLICY IF EXISTS "Authenticated users can create their own orders" ON public.orders;

-- Create a new policy that allows both authenticated users and guests to create orders
-- Guest orders require: valid shipping address with fullName, address, city, email, and phone (10+ chars)
CREATE POLICY "Anyone can create orders with valid shipping info" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Valid shipping address is required for all orders
  shipping_address IS NOT NULL
  AND (shipping_address ->> 'fullName') IS NOT NULL
  AND (shipping_address ->> 'address') IS NOT NULL
  AND (shipping_address ->> 'city') IS NOT NULL
  AND (shipping_address ->> 'email') IS NOT NULL
  AND (shipping_address ->> 'phone') IS NOT NULL
  AND length((shipping_address ->> 'fullName')::text) >= 2
  AND length((shipping_address ->> 'address')::text) >= 5
  AND length((shipping_address ->> 'email')::text) >= 5
  AND length((shipping_address ->> 'phone')::text) >= 10
  AND (
    -- Either: authenticated user with matching user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    -- Or: guest order with null user_id  
    OR (auth.uid() IS NULL AND user_id IS NULL)
    -- Or: authenticated user placing guest order (user_id is null)
    OR (auth.uid() IS NOT NULL AND user_id IS NULL)
  )
);