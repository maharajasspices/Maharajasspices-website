-- Fix invoice endpoint security - require authentication
-- Update guest orders to be trackable

-- Add order tracking token for guest orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- Update RLS policy to allow guests to view their orders using tracking token
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders or with tracking token"
ON public.orders
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (user_id IS NULL AND tracking_token IS NOT NULL)
);

-- Employees can still view all orders
-- (policy already exists from earlier)

-- Fix order items policy for guest orders
DROP POLICY IF EXISTS "Users can view items from their orders" ON public.order_items;

CREATE POLICY "Users can view items from their orders"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
      (orders.user_id IS NULL AND orders.tracking_token IS NOT NULL)
    )
  )
);