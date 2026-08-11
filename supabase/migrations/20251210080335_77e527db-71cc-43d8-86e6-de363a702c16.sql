-- Re-enable RLS but with a truly permissive policy
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies on orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders with valid shipping info" ON public.orders;

-- Create a policy that allows anyone to insert (uses TRUE for simplest case)
CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);