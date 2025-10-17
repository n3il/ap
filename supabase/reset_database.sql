-- =====================================================
-- DATABASE RESET SCRIPT
-- =====================================================
-- This script will DROP all existing auth-related tables,
-- views, functions, and triggers, then recreate them fresh.
--
-- ⚠️  WARNING: This will DELETE ALL USER DATA! ⚠️
-- Only run this on development databases or when you
-- want to completely reset your authentication system.
-- =====================================================

-- Step 1: Drop dependent objects first (views)
-- =====================================================
DROP VIEW IF EXISTS user_info CASCADE;

-- Step 2: Drop triggers
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_profile_updated ON profiles;
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;

-- Step 3: Drop functions
-- =====================================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Step 4: Drop tables (this will delete all data!)
-- =====================================================
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 5: Recreate everything fresh
-- =====================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone_number TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Authentication metadata
  auth_provider TEXT, -- 'email', 'phone', 'google', 'apple'
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- App settings
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB DEFAULT '{}'::jsonb, -- Store custom onboarding responses

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can only read and update their own profile
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
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
CREATE OR REPLACE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- View to easily get complete user information
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
-- Reset Complete!
-- =====================================================
-- Your database has been reset with:
-- ✅ Fresh profiles table
-- ✅ RLS policies configured
-- ✅ Auto-profile creation trigger
-- ✅ Indexes for performance
-- ✅ user_info view
--
-- Next steps:
-- 1. Test authentication flows
-- 2. Verify profiles are auto-created
-- 3. Check RLS policies are working
-- =====================================================
