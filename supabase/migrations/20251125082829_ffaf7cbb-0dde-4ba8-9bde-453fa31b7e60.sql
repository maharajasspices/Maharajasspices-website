-- Add variants column to products table for size/price variations
ALTER TABLE public.products 
ADD COLUMN variants JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.variants IS 'Array of product variants with size and price: [{size: string, price: number}]';