-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a very simple INSERT policy - allow all inserts, validation handled by app
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);