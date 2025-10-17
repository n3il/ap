-- Quick database check script
-- Run this to verify your database structure

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. Check all columns in profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if onboarding_completed column exists specifically
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name = 'onboarding_completed'
) as onboarding_completed_exists;

-- 4. Check for any existing user profiles
SELECT
  id,
  email,
  phone_number,
  display_name,
  onboarding_completed,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
