-- Fix add_employee_role RPC to require admin authorization
-- This prevents any authenticated user from granting themselves employee/admin roles

CREATE OR REPLACE FUNCTION public.add_employee_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- CRITICAL: Check if calling user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can add employee roles';
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert employee role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;