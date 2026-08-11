-- Update invoice seller details
ALTER TABLE public.invoices 
  ALTER COLUMN seller_address SET DEFAULT '10A Woodlands Dr, Waterfall, 3652',
  ALTER COLUMN seller_vat_number SET DEFAULT '4280271828';

-- Add courier_waybill and courier_cost columns to orders table for Courier Guy integration
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS courier_waybill TEXT,
  ADD COLUMN IF NOT EXISTS courier_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS courier_markup NUMERIC DEFAULT 0;