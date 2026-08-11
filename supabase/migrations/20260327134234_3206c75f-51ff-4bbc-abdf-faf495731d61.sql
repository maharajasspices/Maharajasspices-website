-- Move waybill LBZ8SL from cancelled duplicate to the real order, and clear it from the cancelled one
UPDATE public.orders SET courier_waybill = 'LBZ8SL' WHERE id = '02e4678b-b2cd-4964-9a54-03b7afbd46bd';
UPDATE public.orders SET courier_waybill = NULL WHERE id = '3e2ed5f1-558a-4316-a287-4f7677a46dd9';