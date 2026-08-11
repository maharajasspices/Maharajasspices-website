-- Add birthday and phone to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS birthday_opt_in boolean DEFAULT false;

-- Create user credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
ON public.user_credits
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update credits
CREATE POLICY "Admins can update credits"
ON public.user_credits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create credit transactions log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('awarded', 'used', 'adjusted', 'birthday')),
  description text,
  order_id uuid REFERENCES public.orders(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transaction history
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can create transactions
CREATE POLICY "Admins can create transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create employee activity log
CREATE TABLE IF NOT EXISTS public.employee_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.employee_logs ENABLE ROW LEVEL SECURITY;

-- Employees can view all logs
CREATE POLICY "Employees can view logs"
ON public.employee_logs
FOR SELECT
USING (has_role(auth.uid(), 'employee') OR has_role(auth.uid(), 'admin'));

-- Employees can create logs
CREATE POLICY "Employees can create logs"
ON public.employee_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'employee') OR has_role(auth.uid(), 'admin'));

-- Create pickup locations table
CREATE TABLE IF NOT EXISTS public.pickup_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  phone text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can view active pickup locations
CREATE POLICY "Anyone can view active pickup locations"
ON public.pickup_locations
FOR SELECT
USING (active = true);

-- Admins can manage pickup locations
CREATE POLICY "Admins can manage pickup locations"
ON public.pickup_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert Waterfall pickup location
INSERT INTO public.pickup_locations (name, address, city, phone)
VALUES ('Maharaja Spice Emporium - Waterfall', 'Waterfall City, Johannesburg', 'Johannesburg', '+27 11 123 4567')
ON CONFLICT DO NOTHING;

-- Add credits_used to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS credits_used numeric DEFAULT 0;

-- Function to update credit balance
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update user's credit balance
    UPDATE public.user_credits
    SET balance = balance + NEW.amount,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Create user_credits record if it doesn't exist
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.user_id, NEW.amount)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = user_credits.balance + NEW.amount,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update balance on transaction
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_credit_balance();

-- Update handle_new_user to create credit record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create credit account
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Check if this is the admin email
  IF NEW.email = 'aryan123qwer@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Add default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;