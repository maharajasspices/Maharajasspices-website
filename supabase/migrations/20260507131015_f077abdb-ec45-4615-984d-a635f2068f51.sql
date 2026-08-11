-- Restrict access to credit_pin column so it cannot be returned to authenticated/anon clients via RLS.
-- Service role (used by edge functions) retains full access.
REVOKE SELECT (credit_pin) ON public.user_credits FROM anon, authenticated;
REVOKE UPDATE (credit_pin) ON public.user_credits FROM anon, authenticated;
REVOKE INSERT (credit_pin) ON public.user_credits FROM anon, authenticated;