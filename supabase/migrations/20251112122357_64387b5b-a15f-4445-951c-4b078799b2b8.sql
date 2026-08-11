-- Update RLS policies to allow guest checkout (users without auth)
-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create new policies that support guest checkout
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
  CASE 
    WHEN user_id IS NULL THEN false  -- Guest orders can't be viewed (no auth)
    ELSE auth.uid() = user_id        -- Authenticated users can view their orders
  END
);