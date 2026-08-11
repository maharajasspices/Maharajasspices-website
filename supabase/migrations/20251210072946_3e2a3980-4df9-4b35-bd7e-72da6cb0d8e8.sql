-- Drop the vulnerable RLS policy that exposes guest orders
DROP POLICY IF EXISTS "Users can view their own orders or with tracking token" ON orders;

-- Create a secure policy for authenticated users to view only their own orders
CREATE POLICY "Authenticated users can view their own orders" ON orders
FOR SELECT USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));