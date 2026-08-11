-- Fix 1: Update the credit balance trigger to prevent race conditions
-- Use a single atomic INSERT ... ON CONFLICT with proper locking

CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Use a single atomic operation with row-level locking via ON CONFLICT
    -- This prevents race conditions by using FOR UPDATE behavior implicitly
    INSERT INTO public.user_credits (user_id, balance, credit_pin)
    VALUES (NEW.user_id, NEW.amount, NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_credits.balance + EXCLUDED.balance,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix 2: Clean up orphaned chat messages with NULL user_id before adding constraint
DELETE FROM public.chat_messages WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent anonymous chat data
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET NOT NULL;