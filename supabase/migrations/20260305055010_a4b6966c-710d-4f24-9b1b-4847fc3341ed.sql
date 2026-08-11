-- Voucher infrastructure
CREATE TABLE IF NOT EXISTS public.voucher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  minimum_order_total numeric(10,2) NOT NULL DEFAULT 250.00 CHECK (minimum_order_total >= 0),
  is_active boolean NOT NULL DEFAULT true,
  reserved_order_id uuid NULL,
  reserved_at timestamptz NULL,
  redeemed_order_id uuid NULL,
  redeemed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

-- No client policies: service-role edge functions only.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS voucher_discount numeric(10,2) NOT NULL DEFAULT 0;

-- Admin role assignment function (supports employee/admin/customer/manager)
CREATE OR REPLACE FUNCTION public.add_user_role(user_email text, role_to_add public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = lower(trim(user_email));

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, role_to_add)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_user_role(text, public.app_role) TO authenticated;

-- Seed requested vouchers (R250 each)
INSERT INTO public.voucher_codes (code, amount, minimum_order_total, is_active)
VALUES
  ('MSPICE-250-A1K9', 250.00, 250.00, true),
  ('MSPICE-250-B7R3', 250.00, 250.00, true),
  ('MSPICE-250-C4T8', 250.00, 250.00, true),
  ('MSPICE-250-D2M6', 250.00, 250.00, true)
ON CONFLICT (code) DO NOTHING;

-- Ensure Bradley has admin visibility on admin dashboard + orders portal
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'bradley@maharajasspices.co.za'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employee'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'bradley@maharajasspices.co.za'
ON CONFLICT (user_id, role) DO NOTHING;