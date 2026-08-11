-- Revoke direct SELECT on credit_pin column from authenticated users
-- This prevents bypassing the reveal-credit-pin edge function
REVOKE SELECT (credit_pin) ON public.user_credits FROM authenticated;
REVOKE SELECT (credit_pin) ON public.user_credits FROM anon;