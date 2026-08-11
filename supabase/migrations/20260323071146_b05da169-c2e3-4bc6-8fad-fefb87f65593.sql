UPDATE public.orders 
SET courier_waybill = NULL, 
    shipment_creation_started_at = NULL, 
    shipment_creation_error = NULL 
WHERE id = '62d2fc48-606d-4da1-9df2-41616bb17a1c';