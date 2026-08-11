-- Update credit_transactions CHECK constraint to include birthday_reward
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_transaction_type_check 
CHECK (transaction_type IN ('earned', 'spent', 'admin_added', 'birthday_reward', 'refund'));

-- Create trigger to automatically update credit balance (if not exists)
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on credit_transactions (if not exists)
DROP TRIGGER IF EXISTS update_credit_balance_trigger ON public.credit_transactions;
CREATE TRIGGER update_credit_balance_trigger
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_credit_balance();