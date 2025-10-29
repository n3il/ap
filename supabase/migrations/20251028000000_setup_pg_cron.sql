-- Enable pg_cron extension for scheduled jobs
-- Note: pg_cron is available by default on Supabase projects
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant necessary permissions to the service role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Function to trigger agent scheduler edge function
CREATE OR REPLACE FUNCTION public.trigger_agent_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_status integer;
  response_body text;
BEGIN
  -- Call the agent_scheduler edge function via HTTP
  -- This uses the pg_net extension which is available in Supabase
  SELECT status, body INTO response_status, response_body
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/agent_scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000 -- 5 minutes
  );

  -- Log the result (optional - you can remove this in production)
  IF response_status >= 200 AND response_status < 300 THEN
    RAISE NOTICE 'Agent scheduler executed successfully: %', response_status;
  ELSE
    RAISE WARNING 'Agent scheduler returned status %: %', response_status, response_body;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger agent scheduler: %', SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_agent_scheduler() IS
  'Triggers the agent_scheduler Edge Function to run assessments for all active agents. Called by pg_cron.';

-- Schedule the cron job to run every 15 minutes
-- This will run at 0, 15, 30, and 45 minutes past every hour
-- First unschedule if it exists, then create it (idempotent)
DO $$
BEGIN
  -- Try to unschedule if exists (won't error if it doesn't exist)
  PERFORM cron.unschedule('agent-scheduler-15min');
EXCEPTION
  WHEN undefined_object THEN
    -- Job doesn't exist, that's fine
    NULL;
END $$;

-- Now schedule the job
SELECT cron.schedule(
  'agent-scheduler-15min',           -- job name
  '0,15,30,45 * * * *',               -- cron schedule (every 15 minutes)
  $$SELECT public.trigger_agent_scheduler();$$  -- command to execute
);

-- Optional: Additional cron jobs can be added here
-- Example: Daily cleanup job (commented out)
-- SELECT cron.schedule(
--   'daily-cleanup',
--   '0 2 * * *',  -- Run at 2 AM every day
--   $$SELECT public.cleanup_old_data();$$
-- );

-- View current cron jobs (for verification)
-- SELECT * FROM cron.job;
