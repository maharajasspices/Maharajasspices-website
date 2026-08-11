-- Fix: Drop overly permissive profiles policy that allows anyone to read all customer data
-- The existing policies for self-access and employee access will remain
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;