-- Temporarily disable RLS on orders table for anonymous inserts
-- The edge function will handle security using service role
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;