-- Update orders table to store items directly (for guest checkout and invoice generation)
-- Add items column to store order items as JSONB
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;