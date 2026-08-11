
-- Fix 1: order_items guest order exposure
-- Remove the old policy that exposes all guest order items to any authenticated user
DROP POLICY IF EXISTS "Users can view items from their orders" ON public.order_items;

-- Recreate: only authenticated users can see their OWN order items (no guest order leak)
CREATE POLICY "Users can view items from their orders"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND auth.uid() IS NOT NULL
      AND orders.user_id = auth.uid()
  )
);

-- Fix 2: sc_value_ratings unauthorized insert
-- Drop any existing INSERT policies on sc_value_ratings
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'sc_value_ratings' AND schemaname = 'public' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sc_value_ratings', pol.policyname);
  END LOOP;
END $$;

-- Create restricted insert policy: only assigned peer raters can submit ratings
CREATE POLICY "Assigned peers can insert ratings"
ON public.sc_value_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = rater_id
  AND EXISTS (
    SELECT 1 FROM public.sc_peer_assignments pa
    JOIN public.sc_scorecards sc ON sc.employee_id = pa.employee_id
      AND sc.assessment_period_id = pa.period_id
    WHERE pa.assigned_rater_id = auth.uid()
      AND sc.id = scorecard_id
      AND pa.completed = false
  )
);
