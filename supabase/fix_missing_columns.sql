-- =====================================================
-- FIX MISSING COLUMNS SCRIPT
-- =====================================================
-- This script will add any missing columns to the profiles table
-- Run this if you're getting errors about missing columns
-- =====================================================

-- First, let's see what we have
-- Run this query first to check current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Add all potentially missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate RLS policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Recreate functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_profile_updated ON profiles;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
  user_email TEXT;
  user_phone TEXT;
BEGIN
  -- Determine auth provider
  IF NEW.phone IS NOT NULL THEN
    provider := 'phone';
    user_phone := NEW.phone;
  ELSIF NEW.raw_user_meta_data->>'provider' = 'google' THEN
    provider := 'google';
    user_email := NEW.email;
  ELSIF NEW.raw_user_meta_data->>'provider' = 'apple' THEN
    provider := 'apple';
    user_email := NEW.email;
  ELSE
    provider := 'email';
    user_email := NEW.email;
  END IF;

  -- Insert user profile with appropriate data
  INSERT INTO public.profiles (
    id,
    email,
    phone_number,
    display_name,
    avatar_url,
    auth_provider,
    email_verified,
    phone_verified
  )
  VALUES (
    NEW.id,
    COALESCE(user_email, NEW.email),
    user_phone,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      NEW.phone
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    provider,
    CASE WHEN provider IN ('google', 'apple') THEN true ELSE NEW.email_confirmed_at IS NOT NULL END,
    CASE WHEN provider = 'phone' THEN NEW.phone_confirmed_at IS NOT NULL ELSE false END
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Recreate the view
DROP VIEW IF EXISTS user_info CASCADE;

CREATE OR REPLACE VIEW user_info AS
SELECT
  up.id,
  up.email,
  up.phone_number,
  up.display_name,
  up.avatar_url,
  up.bio,
  up.auth_provider,
  up.email_verified,
  up.phone_verified,
  up.notifications_enabled,
  up.theme,
  up.onboarding_completed,
  up.onboarding_data,
  up.created_at,
  up.updated_at,
  au.last_sign_in_at,
  au.confirmed_at
FROM profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- =====================================================
-- Fix Complete!
-- =====================================================
-- Run this to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- =====================================================
