-- Update seller defaults for Maharaja's Spices with user-provided details
ALTER TABLE public.invoices 
  ALTER COLUMN seller_name SET DEFAULT 'Maharaja''s Spices',
  ALTER COLUMN seller_address SET DEFAULT '14 Electron Road, Isipingo, Durban, KwaZulu-Natal, 4133',
  ALTER COLUMN seller_phone SET DEFAULT '+27 68 405 1374',
  ALTER COLUMN seller_email SET DEFAULT 'e-commerce@maharajasspices.co.za',
  ALTER COLUMN seller_vat_number SET DEFAULT 'TBC';