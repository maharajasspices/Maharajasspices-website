-- Create chat messages table for chatbot history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own chat history
CREATE POLICY "Users can view their own chat history"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id, created_at);

-- Create order_history table to track purchases per user
CREATE TABLE public.order_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own order history
CREATE POLICY "Users can view their own order history"
ON public.order_history
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert order history
CREATE POLICY "Authenticated users can insert order history"
ON public.order_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to update order_history
CREATE OR REPLACE FUNCTION public.track_order_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_history (order_id, user_id, status)
  VALUES (NEW.id, NEW.user_id, NEW.status);
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_new_orders
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.track_order_history();