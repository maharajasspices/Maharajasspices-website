-- Create image_metadata table to store Z1 Storage object metadata
CREATE TABLE public.image_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE, -- Z1 Storage object key
  bucket TEXT NOT NULL, -- products/full/ or forum/
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  forum_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  description TEXT,
  alt_text TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CHECK (
    (product_id IS NOT NULL AND forum_post_id IS NULL) OR
    (product_id IS NULL AND forum_post_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for viewing image metadata
CREATE POLICY "Anyone can view image metadata"
ON public.image_metadata
FOR SELECT
USING (true);

-- Policies for employees to manage product images
CREATE POLICY "Employees can insert product image metadata"
ON public.image_metadata
FOR INSERT
WITH CHECK (
  bucket = 'products/full/' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
  )
);

CREATE POLICY "Employees can update product image metadata"
ON public.image_metadata
FOR UPDATE
USING (
  bucket = 'products/full/' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
  )
);

CREATE POLICY "Employees can delete product image metadata"
ON public.image_metadata
FOR DELETE
USING (
  bucket = 'products/full/' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
  )
);

-- Policies for authenticated users to manage their forum images
CREATE POLICY "Users can insert their own forum image metadata"
ON public.image_metadata
FOR INSERT
WITH CHECK (
  bucket = 'forum/' AND
  auth.uid() IS NOT NULL AND
  created_by = auth.uid()
);

CREATE POLICY "Users can delete their own forum image metadata"
ON public.image_metadata
FOR DELETE
USING (
  bucket = 'forum/' AND
  auth.uid() = created_by
);

-- Index for faster lookups
CREATE INDEX idx_image_metadata_product_id ON public.image_metadata(product_id);
CREATE INDEX idx_image_metadata_forum_post_id ON public.image_metadata(forum_post_id);
CREATE INDEX idx_image_metadata_bucket ON public.image_metadata(bucket);

-- Trigger for updated_at
CREATE TRIGGER update_image_metadata_updated_at
BEFORE UPDATE ON public.image_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();