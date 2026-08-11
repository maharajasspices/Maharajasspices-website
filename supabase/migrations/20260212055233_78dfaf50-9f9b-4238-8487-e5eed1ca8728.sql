
-- Create a safe view that excludes credit_pin
CREATE OR REPLACE VIEW public.user_credits_safe AS
SELECT id, user_id, balance, created_at, updated_at
FROM public.user_credits;

-- Drop the existing user SELECT policy that exposes credit_pin
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;

-- Recreate user SELECT policy restricted to employees/admins only (service role bypasses RLS)
-- Regular users will use the view instead
CREATE POLICY "Only employees can view user_credits directly"
ON public.user_credits
FOR SELECT
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on the view is not needed - views inherit from base table
-- Grant select on the view to authenticated users
GRANT SELECT ON public.user_credits_safe TO authenticated;
GRANT SELECT ON public.user_credits_safe TO anon;
