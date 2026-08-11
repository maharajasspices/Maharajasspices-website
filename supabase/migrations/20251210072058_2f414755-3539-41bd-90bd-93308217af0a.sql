-- Drop the overly permissive guest order RLS policy
DROP POLICY IF EXISTS "Guest users can view orders with valid tracking token and email" ON orders;

-- Note: Guest order access is now handled securely via the track-order edge function
-- which validates both tracking_token AND email before returning order data.
-- This removes the direct database access vulnerability.