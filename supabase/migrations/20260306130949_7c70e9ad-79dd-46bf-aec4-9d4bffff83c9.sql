-- Add RLS policies to voucher_codes table (RLS is enabled but no policies exist)

-- Employees/admins can manage voucher codes
CREATE POLICY "Employees can manage voucher codes"
ON public.voucher_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow service role operations (edge functions use service role for voucher validation)
-- No public SELECT needed - voucher validation happens server-side via edge functions