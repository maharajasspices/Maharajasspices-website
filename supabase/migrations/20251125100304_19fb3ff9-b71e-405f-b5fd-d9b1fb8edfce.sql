-- Fix storage policies for forum bucket
-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Forum images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own forum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum images" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Employees can delete product images" ON storage.objects;

-- Forum storage policies (fix the upload issue)
CREATE POLICY "Forum images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum');

CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own forum images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'forum' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own forum images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can delete any forum images
CREATE POLICY "Admins can delete any forum images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Product storage policies for employees
CREATE POLICY "Employees can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Maharajas-Basic-Products'
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Employees can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'Maharajas-Basic-Products'
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Employees can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'Maharajas-Basic-Products'
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Create newsletter_subscribers table for the newsletter feature
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter policies
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Employees can view all subscribers"
ON public.newsletter_subscribers FOR SELECT
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));