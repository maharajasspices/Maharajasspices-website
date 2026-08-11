-- Add indexes for frequently queried columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_category_price ON public.products(category, price);
CREATE INDEX IF NOT EXISTS idx_products_category_in_stock ON public.products(category, in_stock);

-- Index for orders queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Index for recently viewed queries
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);

-- Index for product likes
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON public.product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON public.product_likes(product_id);