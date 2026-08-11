ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipment_creation_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipment_creation_error TEXT;

COMMENT ON COLUMN public.orders.shipment_creation_started_at IS 'Server-side lock timestamp to prevent duplicate Courier Guy shipment creation.';
COMMENT ON COLUMN public.orders.shipment_creation_error IS 'Last shipment creation error for debugging/retry visibility.';