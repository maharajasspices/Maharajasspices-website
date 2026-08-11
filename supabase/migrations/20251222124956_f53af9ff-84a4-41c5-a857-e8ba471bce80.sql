-- Create invoices table for SARS-compliant tax invoices
-- Stores structured data only - PDFs generated on demand

CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Seller details (stored for historical accuracy)
  seller_name TEXT NOT NULL DEFAULT 'Maharaja''s Spices (Pty) Ltd',
  seller_address TEXT NOT NULL DEFAULT '123 Spice Road, Durban, KwaZulu-Natal, 4001',
  seller_vat_number TEXT NOT NULL DEFAULT '4123456789',
  seller_phone TEXT DEFAULT '+27 31 123 4567',
  seller_email TEXT DEFAULT 'accounts@maharajasspices.co.za',
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address JSONB,
  
  -- Line items with VAT breakdown (JSONB array)
  -- Each item: { product_id, name, quantity, unit_price_incl, unit_price_excl, vat_amount, line_total_incl, line_total_excl, line_vat }
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Totals
  subtotal_excl_vat NUMERIC(12,2) NOT NULL,
  total_vat NUMERIC(12,2) NOT NULL,
  total_incl_vat NUMERIC(12,2) NOT NULL,
  
  -- VAT rate used (stored for audit trail)
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  
  -- Payment reference
  payment_reference TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Employees/Admins can view all invoices
CREATE POLICY "Employees can view all invoices"
ON public.invoices
FOR SELECT
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only service role can insert (via edge function)
CREATE POLICY "Service role can insert invoices"
ON public.invoices
FOR INSERT
WITH CHECK (false);

-- Index for fast lookups
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for invoice numbers (format: INV-YYYYMM-XXXXX)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;