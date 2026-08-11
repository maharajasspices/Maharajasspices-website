
-- Fix the security definer view issue by recreating with security_invoker
DROP VIEW IF EXISTS public.user_credits_safe;

CREATE VIEW public.user_credits_safe
WITH (security_invoker = true)
AS
SELECT id, user_id, balance, created_at, updated_at
FROM public.user_credits;

-- Re-grant permissions
GRANT SELECT ON public.user_credits_safe TO authenticated;
GRANT SELECT ON public.user_credits_safe TO anon;

-- We need users to be able to SELECT from user_credits (through the view) but only safe columns
-- The view with security_invoker means the querying user's permissions apply
-- So we need the original user SELECT policy back on the base table for the view to work
DROP POLICY IF EXISTS "Only employees can view user_credits directly" ON public.user_credits;

-- Restore user SELECT policy on the base table (view will filter columns)
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);
