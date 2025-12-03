-- Fix cron function to call scheduled-blog-generation function instead of generate-blog directly
-- This avoids the Vault authentication issue entirely

-- Drop the old function that uses Vault
DROP FUNCTION IF EXISTS trigger_daily_blog_generation();

-- Create updated function that calls the working scheduled-blog-generation Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_blog_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Use the scheduled-blog-generation function which we know works
  function_url := 'https://aoyotcelouqoxfelhibh.supabase.co/functions/v1/scheduled-blog-generation';

  -- Make HTTP request to scheduled-blog-generation Edge Function
  -- This function internally handles authentication and calls generate-blog
  SELECT extensions.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000  -- 2 minute timeout for blog generation
  ) INTO request_id;

  -- Log the request
  RAISE LOG 'Daily blog generation triggered with request_id: %', request_id;
END;
$$;

-- Reschedule the cron job to use the new function
DO $$
BEGIN
  -- Unschedule existing job
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

COMMENT ON FUNCTION trigger_daily_blog_generation IS 'Triggers daily blog generation via scheduled-blog-generation Edge Function. Bypasses Vault authentication issues.';
