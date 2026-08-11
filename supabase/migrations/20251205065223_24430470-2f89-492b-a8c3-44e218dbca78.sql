-- Add credit_pin column to user_credits table for M-Wallet security
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS credit_pin text;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_credits.credit_pin IS 'Auto-generated PIN for M-Wallet credit usage verification';