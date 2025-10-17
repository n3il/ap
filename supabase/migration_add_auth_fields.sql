-- Migration: Add new authentication-related fields to profiles table
-- Run this if you already have an existing profiles table

-- Add new columns (if they don't exist)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- Backfill existing users with data from auth.users
UPDATE profiles up
SET
  email = COALESCE(up.email, au.email),
  phone_number = COALESCE(up.phone_number, au.phone),
  auth_provider = COALESCE(
    up.auth_provider,
    CASE
      WHEN au.phone IS NOT NULL THEN 'phone'
      WHEN au.raw_user_meta_data->>'provider' = 'google' THEN 'google'
      WHEN au.raw_user_meta_data->>'provider' = 'apple' THEN 'apple'
      ELSE 'email'
    END
  ),
  email_verified = COALESCE(up.email_verified, au.email_confirmed_at IS NOT NULL),
  phone_verified = COALESCE(up.phone_verified, au.phone_confirmed_at IS NOT NULL),
  avatar_url = COALESCE(up.avatar_url, au.raw_user_meta_data->>'avatar_url')
FROM auth.users au
WHERE up.id = au.id;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Recreate the handle_new_user function with new logic
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

-- Create/recreate the user_info view
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
