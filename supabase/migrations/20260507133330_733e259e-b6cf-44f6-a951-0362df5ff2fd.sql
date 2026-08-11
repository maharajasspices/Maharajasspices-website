
-- 1. Tighten anonymous order INSERT policy
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;

CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (
    -- Authenticated users: must own the order
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Guest users: strict validation
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND shipping_address IS NOT NULL
      AND shipping_address ? 'email'
      AND length(coalesce(shipping_address->>'email','')) > 3
      AND total > 0
      AND subtotal >= 0
      AND coalesce(status, 'pending') = 'pending'
      AND courier_waybill IS NULL
    )
  )
);

-- 2. Add explicit storage policies on public product/logo buckets
DO $$
DECLARE
  b text;
  buckets text[] := ARRAY[
    'pure-spices-raw-products-1',
    'spices-update',
    'crunch coat curry boxes other spice',
    'remaining-spices',
    'logos',
    'Maharajas-Basic-Products'
  ];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format($p$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR SELECT TO public
        USING (bucket_id = %L);
    $p$,
      'public_read_' || b, 'public_read_' || b, b);

    EXECUTE format($p$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = %L AND (public.has_role(auth.uid(), 'employee'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)));
    $p$,
      'staff_insert_' || b, 'staff_insert_' || b, b);

    EXECUTE format($p$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = %L AND (public.has_role(auth.uid(), 'employee'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)))
        WITH CHECK (bucket_id = %L AND (public.has_role(auth.uid(), 'employee'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)));
    $p$,
      'staff_update_' || b, 'staff_update_' || b, b, b);

    EXECUTE format($p$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = %L AND (public.has_role(auth.uid(), 'employee'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)));
    $p$,
      'staff_delete_' || b, 'staff_delete_' || b, b);
  END LOOP;
END $$;

-- 3. Revoke EXECUTE from anon on SECURITY DEFINER functions that should not be publicly callable
-- (excluding fms_* functions per project memory)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sc_is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sc_is_manager_or_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_credit_pin(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_credit_pin(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_user_role(text, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.remove_user_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.remove_user_completely(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_employee_role(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_value_feedback_anonymous(uuid) FROM anon;

-- Trigger-only functions: revoke EXECUTE from everyone except postgres/service_role
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_credit_balance() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.track_order_history() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_order_financials() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_sensitive_access() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_credit_pin_direct_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_employee_log_actor() FROM anon, authenticated, public;
