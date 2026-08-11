-- Allow employees and admins to update orders
CREATE POLICY "Employees can update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));