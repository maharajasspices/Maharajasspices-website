
-- Fix: user_roles_self_insert - explicitly block all client-side inserts
-- RLS blocks by default when no INSERT policy exists, but an explicit restrictive policy
-- makes the intent clear and prevents accidental future permissive policies from opening it up.
CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- Also add explicit block for UPDATE and DELETE if not already present
CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (false);
