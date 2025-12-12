-- Add photo column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo TEXT;

COMMENT ON COLUMN public.profiles.photo IS 'URL to user profile photo (Supabase Storage, external URL, or data URI)';

-- Add photo column to agents table
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS photo TEXT;

COMMENT ON COLUMN public.agents.photo IS 'URL to agent avatar/photo (Supabase Storage, external URL, or data URI)';
