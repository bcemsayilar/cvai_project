-- Add ATS analysis tracking to profiles table
DO $$
BEGIN
  -- Add ATS analyses used column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ats_analyses_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ats_analyses_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add ATS analyses limit column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'ats_analyses_limit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ats_analyses_limit INTEGER DEFAULT 5;
  END IF;
END
$$;

-- Update existing profiles with default ATS limits
UPDATE public.profiles 
SET 
  ats_analyses_used = COALESCE(ats_analyses_used, 0),
  ats_analyses_limit = CASE 
    WHEN subscription_type = 'trial' THEN 5
    WHEN subscription_type = 'basic' THEN 10
    WHEN subscription_type = 'premium' THEN -1  -- Unlimited
    ELSE 5
  END
WHERE ats_analyses_limit IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_ats_usage ON public.profiles(ats_analyses_used, ats_analyses_limit);
