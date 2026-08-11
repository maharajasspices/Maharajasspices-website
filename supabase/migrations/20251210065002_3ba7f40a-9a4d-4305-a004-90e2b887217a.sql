-- Fix the trigger function to handle guest orders with null user_id
-- The order_history table requires user_id, but guest orders have null user_id
-- Solution: Only track history for authenticated orders, OR make user_id nullable

-- Option 1: Make user_id nullable in order_history table
ALTER TABLE public.order_history ALTER COLUMN user_id DROP NOT NULL;

-- Update the trigger function to properly handle null user_id
CREATE OR REPLACE FUNCTION public.track_order_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.order_history (order_id, user_id, status)
  VALUES (NEW.id, NEW.user_id, NEW.status);
  RETURN NEW;
END;
$function$;