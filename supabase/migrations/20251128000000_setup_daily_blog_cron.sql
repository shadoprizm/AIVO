/*
  # Setup Daily Blog Generation Cron Job

  1. Changes
    - Enable pg_cron extension
    - Create a cron job that runs daily at 10 AM UTC
    - Calls the generate-blog Edge Function directly using pg_net
    - Uses Supabase's service role for authentication

  2. Setup Instructions
    After running this migration, you need to configure the secrets in Supabase Dashboard:
    - Go to Project Settings > Database > Vault
    - Add two secrets:
      - Name: 'supabase_url' with value: your project URL (e.g., https://xxx.supabase.co)
      - Name: 'service_role_key' with value: your service role key from API settings

    Or use SQL:
      SELECT vault.create_secret('YOUR_PROJECT_URL', 'supabase_url');
      SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');

  3. Notes
    - pg_cron is available in Supabase hosted projects
    - The cron expression '0 10 * * *' means: run at 10:00 AM UTC every day
    - Uses pg_net to make HTTP requests to the Edge Function
    - To change the schedule time, unschedule and reschedule:
      SELECT cron.unschedule('daily-blog-generation');
      SELECT cron.schedule('daily-blog-generation', 'NEW_CRON_EXPRESSION', $$SELECT trigger_daily_blog_generation()$$);
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to trigger blog generation
-- This function retrieves secrets and calls the Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_blog_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  request_id bigint;
  function_url text;
BEGIN
  -- Retrieve secrets from Vault
  -- Note: You need to set these up in Supabase Dashboard after running this migration
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url'
  LIMIT 1;

  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- Ensure secrets are configured
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE EXCEPTION 'Secrets not configured. Please set up supabase_url and service_role_key in Vault.';
  END IF;

  -- Build the function URL
  function_url := supabase_url || '/functions/v1/generate-blog';

  -- Make HTTP request to generate-blog Edge Function
  -- Using extensions.http_post (pg_net)
  SELECT extensions.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000  -- 2 minute timeout for blog generation
  ) INTO request_id;

  -- Log the request
  RAISE LOG 'Daily blog generation triggered with request_id: %', request_id;
END;
$$;

-- Schedule the cron job to run daily at 10 AM UTC
-- This will generate one blog post per day
DO $$
BEGIN
  -- Unschedule if exists (for migration reruns)
  PERFORM cron.unschedule('daily-blog-generation');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-blog-generation',           -- Job name
  '0 10 * * *',                      -- Cron expression: 10 AM UTC daily (6 AM EST / 3 AM PST)
  $$SELECT trigger_daily_blog_generation();$$
);

-- Verify the cron job was created
-- You can check scheduled jobs with: SELECT * FROM cron.job;

COMMENT ON FUNCTION trigger_daily_blog_generation IS 'Triggers daily blog generation via Edge Function. Requires supabase_url and service_role_key secrets in Vault.';
