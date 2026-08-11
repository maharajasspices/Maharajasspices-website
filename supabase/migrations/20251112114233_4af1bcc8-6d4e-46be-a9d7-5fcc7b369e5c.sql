-- First, let me check and prepare the user roles setup
-- We'll add the employee role for aryan123qwer@gmail.com once the account is created

-- Create a function to safely add employee role
CREATE OR REPLACE FUNCTION add_employee_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_employee_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_employee_role(text) TO service_role;