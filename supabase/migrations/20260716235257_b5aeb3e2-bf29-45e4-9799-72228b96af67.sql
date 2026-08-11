
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'aryan123qwer@gmail.com';
  IF v_uid IS NOT NULL THEN
    DELETE FROM public.employee_logs WHERE employee_id = v_uid;
    DELETE FROM public.user_roles WHERE user_id = v_uid;
    DELETE FROM public.credit_transactions WHERE user_id = v_uid;
    DELETE FROM public.user_credits WHERE user_id = v_uid;
    DELETE FROM public.product_likes WHERE user_id = v_uid;
    DELETE FROM public.recently_viewed WHERE user_id = v_uid;
    DELETE FROM public.profiles WHERE id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;
  END IF;
END $$;
