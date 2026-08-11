
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;

CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.uid() IS NULL AND user_id IS NULL)
);
