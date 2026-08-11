-- Create forum tables
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Advanced')),
  category TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Forum Categories Policies (public read, employees can manage)
CREATE POLICY "Anyone can view forum categories"
ON public.forum_categories FOR SELECT USING (true);

CREATE POLICY "Employees can manage forum categories"
ON public.forum_categories FOR ALL
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Forum Topics Policies
CREATE POLICY "Anyone can view forum topics"
ON public.forum_topics FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics"
ON public.forum_topics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can edit their own topics"
ON public.forum_topics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employees can manage all topics"
ON public.forum_topics FOR ALL
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Forum Posts Policies
CREATE POLICY "Anyone can view forum posts"
ON public.forum_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
ON public.forum_posts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can edit their own posts"
ON public.forum_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employees can manage all posts"
ON public.forum_posts FOR ALL
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Recipes Policies
CREATE POLICY "Anyone can view recipes"
ON public.recipes FOR SELECT USING (true);

CREATE POLICY "Employees can manage recipes"
ON public.recipes FOR ALL
USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category_id);
CREATE INDEX idx_forum_topics_user ON public.forum_topics(user_id);
CREATE INDEX idx_forum_posts_topic ON public.forum_posts(topic_id);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_recipes_slug ON public.recipes(slug);
CREATE INDEX idx_recipes_category ON public.recipes(category);

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, slug, sort_order) VALUES
('General', 'General discussions and announcements', 'general', 1),
('Recipes', 'Share and discover amazing recipes', 'recipes', 2),
('Shops & Branches', 'Information about our stores across South Africa', 'shops-branches', 3)
ON CONFLICT (slug) DO NOTHING;