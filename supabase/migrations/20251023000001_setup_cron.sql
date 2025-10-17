-- Setup Cron Job for Agent Scheduler
-- This requires the pg_cron extension

-- Enable pg_cron extension (only available in Supabase projects)
-- Note: This may require enabling via Supabase dashboard first

-- Create cron job to run agent assessments every 15 minutes
-- Schedule: At minutes 0, 15, 30, and 45 of every hour

-- First, we'll create a function that calls the Edge Function
CREATE OR REPLACE FUNCTION trigger_agent_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  -- Get environment variables (these need to be set in Supabase)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  -- Call the Edge Function via HTTP
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/agent_scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Schedule the cron job
-- Note: This requires pg_cron to be enabled in your Supabase project
-- You may need to run this via the Supabase SQL Editor or Dashboard

-- SELECT cron.schedule(
--   'agent-scheduler-15min',
--   '0,15,30,45 * * * *',
--   $$SELECT trigger_agent_scheduler();$$
-- );

-- Alternative: Create a trigger that can be called manually or via webhook
-- This is useful for testing before setting up the cron job

COMMENT ON FUNCTION trigger_agent_scheduler() IS 'Triggers the agent scheduler Edge Function to run assessments for all active agents';
