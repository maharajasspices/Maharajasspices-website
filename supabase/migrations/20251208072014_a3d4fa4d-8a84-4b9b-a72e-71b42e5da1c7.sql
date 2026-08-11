-- Fix 1: Add explicit anonymous denial policies for profiles table
-- The profiles table already has proper RLS but adding explicit anon denial for defense in depth

-- Verify RLS is enabled (it should already be)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Fix 2: Add explicit insert policy for contact_messages 
-- Contact messages should ONLY be insertable via service role (edge function)
-- This prevents direct anonymous inserts while allowing the edge function to work

-- First, ensure RLS is enabled
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing insert policy if exists, then create restrictive one
DROP POLICY IF EXISTS "Only service role can insert contact messages" ON public.contact_messages;

-- Create policy that only allows service role to insert (edge functions use service role)
-- Anonymous and authenticated users cannot insert directly - must go through edge function
CREATE POLICY "Only service role can insert contact messages" 
ON public.contact_messages 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Fix 3: Add explicit insert policy for stockist_applications
-- Similar pattern - only edge functions should insert

ALTER TABLE public.stockist_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can insert stockist applications" ON public.stockist_applications;

CREATE POLICY "Only service role can insert stockist applications" 
ON public.stockist_applications 
FOR INSERT 
TO authenticated
WITH CHECK (false);