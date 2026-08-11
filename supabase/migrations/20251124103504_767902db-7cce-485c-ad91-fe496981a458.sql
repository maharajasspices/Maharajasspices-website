-- Reset password for aryan123qwer@gmail.com employee account
-- Generate a secure password: Maharaja2024!Admin

-- First, ensure the user exists and update their password
-- Note: In Supabase, we need to use the auth.users table
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aryan123qwer@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email aryan123qwer@gmail.com not found';
  END IF;

  -- Update the user's password (hashed)
  -- Password: Maharaja2024!Admin
  UPDATE auth.users 
  SET 
    encrypted_password = crypt('Maharaja2024!Admin', gen_salt('bf')),
    updated_at = now()
  WHERE id = v_user_id;

  -- Ensure employee and admin roles exist
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  INSERT INTO public.user_roles (user_id, role) 
  VALUES 
    (v_user_id, 'admin'),
    (v_user_id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  
END $$;