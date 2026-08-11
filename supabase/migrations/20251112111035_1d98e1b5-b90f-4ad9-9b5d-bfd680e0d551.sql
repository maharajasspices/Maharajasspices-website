-- =============================================================================
-- COMPLETE DATABASE SCHEMA EXPORT
-- =============================================================================

-- Step 1: Create custom enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'customer');

-- Step 2: Create tables
-- Profiles table (stores additional user information)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- User roles table (stores user role assignments)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'customer'::app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

-- Products table (stores product catalog)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  description TEXT,
  category TEXT NOT NULL,
  weight TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  in_stock BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Orders table (stores customer orders)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending'::text,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  shipping_address JSONB,
  courier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Order items table (stores line items for each order)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Product likes table (stores user product favorites)
CREATE TABLE public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, product_id)
);

-- Recently viewed table (stores user browsing history)
CREATE TABLE public.recently_viewed (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, product_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_in_stock ON public.products(in_stock) WHERE in_stock = true;
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_product_likes_user_id ON public.product_likes(user_id);
CREATE INDEX idx_product_likes_product_id ON public.product_likes(product_id);
CREATE INDEX idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);

-- Step 4: Create database functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Step 5: Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Employees can insert products"
  ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can delete products"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view items from their orders"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Employees can view all order items"
  ON public.order_items FOR SELECT
  USING (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own likes"
  ON public.product_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes"
  ON public.product_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.product_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own history"
  ON public.recently_viewed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.recently_viewed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON public.recently_viewed FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 8: Insert initial product data
INSERT INTO public.products (id, name, brand, price, original_price, description, category, weight, images, in_stock, created_at, updated_at) VALUES
('ac13e6c4-ce2b-403f-a62e-ae7c2ff8292f', 'Lemon & Herb Seasoning Condiment 50g', 'Maharajas Spices', 29.99, 35.99, 'Demo product', 'Condiments', '50g', ARRAY['/src/assets/products.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('439dcb19-4efc-46df-8c77-76cebfe5142d', 'Ginger Powder Condiment 50g', 'Maharajas Spices', 29.99, NULL, 'Demo product', 'Condiments', '50g', ARRAY['/src/assets/marinades-sauces.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('8a1bb60c-656e-4113-b710-622b53e62b61', 'Turmeric Powder 100g', 'Maharajas Spices', 45.99, 52.99, 'Demo product', 'Pure Spices', '100g', ARRAY['/src/assets/hero-spices.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('ce7677a9-f8f4-4dd6-9217-a35928e6c0e2', 'Curry Powder Blend 200g', 'Maharajas Spices', 79.99, NULL, 'Demo product', 'Mixed Spices', '200g', ARRAY['/src/assets/hero-spices.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('3b361d03-20f2-487a-97de-bd6688ee2f4b', 'BBQ Marinade Sauce 500ml', 'Maharajas Spices', 89.99, 99.99, 'Demo product', 'Marinades', '500ml', ARRAY['/src/assets/marinades-sauces.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('cb334025-f8de-41fc-bc25-6e5fa883c2b9', 'Basmati Rice 1kg', 'Maharajas Spices', 149.99, NULL, 'Demo product', 'Grains', '1kg', ARRAY['/src/assets/grains.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('8f968c21-753c-4ea4-b59a-6f7541ea1518', 'Chilli Paste 250g', 'Mothers Hand', 65.99, NULL, 'Demo product', 'Pastes & Rubs', '250g', ARRAY['/src/assets/products.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00'),
('c58b06b7-845e-40ff-a65d-22b0207f940f', 'Garlic & Herb Sauce 350ml', 'HomeMade', 75.99, 85.99, 'Demo product', 'Sauces', '350ml', ARRAY['/src/assets/marinades-sauces.jpg'], true, '2025-11-02 21:22:55.7647+00', '2025-11-02 21:22:55.7647+00');