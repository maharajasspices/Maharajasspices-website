-- Fix public exposure of customer emails by restricting profile access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow employees and admins to view all profiles
CREATE POLICY "Employees view profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));