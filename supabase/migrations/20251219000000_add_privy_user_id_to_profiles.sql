-- Add privy_user_id column to profiles table for Privy authentication integration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privy_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_privy_user_id ON public.profiles(privy_user_id);

-- Add comment
COMMENT ON COLUMN public.profiles.privy_user_id IS 'Privy user ID for authentication integration';
