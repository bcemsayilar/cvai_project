-- Add Stripe integration columns to profiles table
DO $$
BEGIN
  -- Add Stripe customer ID column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
  
  -- Add Stripe subscription ID column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT UNIQUE;
  END IF;
  
  -- Add payment method ID column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_payment_method_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_payment_method_id TEXT;
  END IF;
END
$$;

-- Update subscription types and limits for new pricing model
UPDATE public.profiles 
SET 
  resumes_limit = CASE 
    WHEN subscription_type = 'trial' THEN 1
    WHEN subscription_type = 'job_hunt_2w' THEN 10
    WHEN subscription_type = 'premium_1m' THEN 25
    WHEN subscription_type = 'job_seeker_3m' THEN 75
    ELSE resumes_limit
  END,
  ats_analyses_limit = CASE 
    WHEN subscription_type = 'trial' THEN 1
    WHEN subscription_type = 'job_hunt_2w' THEN 25
    WHEN subscription_type = 'premium_1m' THEN 50
    WHEN subscription_type = 'job_seeker_3m' THEN 150
    ELSE ats_analyses_limit
  END;

-- Update subscription type check constraint to include new plans
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_type_check 
CHECK (subscription_type IN ('trial', 'job_hunt_2w', 'premium_1m', 'job_seeker_3m'));

-- Create payments table for transaction history
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);

-- Create trigger for payments updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();