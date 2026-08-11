-- Update seller defaults for Maharaja's Spices
ALTER TABLE public.invoices 
  ALTER COLUMN seller_name SET DEFAULT 'Maharaja''s Spices (Pty) Ltd',
  ALTER COLUMN seller_address SET DEFAULT '14 Electron Road, Isipingo, Durban, KwaZulu-Natal, 4133',
  ALTER COLUMN seller_phone SET DEFAULT '+27 31 902 1551',
  ALTER COLUMN seller_email SET DEFAULT 'info@maharajasspices.co.za',
  ALTER COLUMN seller_vat_number SET DEFAULT '4850298356';