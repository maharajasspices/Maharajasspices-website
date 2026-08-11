-- Create product_likes table for authenticated users
CREATE TABLE IF NOT EXISTS public.product_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- Users can view their own likes
CREATE POLICY "Users can view their own likes"
ON public.product_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes"
ON public.product_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.product_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create recently_viewed table for authenticated users
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own history"
ON public.recently_viewed
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
ON public.recently_viewed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own history
CREATE POLICY "Users can update their own history"
ON public.recently_viewed
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON public.product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);