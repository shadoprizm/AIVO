/*
  Setup Secrets for Daily Blog Generation Cron Job

  Run this in your Supabase SQL Editor to configure the required secrets.

  IMPORTANT: Replace the placeholder values below with your actual credentials:
  - Get your Project URL from: Project Settings → API → Project URL
  - Get your Service Role Key from: Project Settings → API → service_role (secret)
*/

-- Step 1: Store your Supabase project URL
-- Replace 'https://aoyotcelouqoxfelhibh.supabase.co' with your actual project URL if different
SELECT vault.create_secret(
  'https://aoyotcelouqoxfelhibh.supabase.co',
  'supabase_url',
  'Configuration for daily blog generation cron job'
);

-- Step 2: Store your Service Role Key
-- REPLACE 'YOUR_SERVICE_ROLE_KEY_HERE' with your actual service role key
-- Find it in: Project Settings → API → service_role (click reveal to see it)
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY_HERE',  -- ⚠️ REPLACE THIS
  'service_role_key',
  'Service role key for daily blog generation cron job'
);

-- Step 3: Verify the secrets were created
SELECT
  name,
  description,
  created_at
FROM vault.secrets
WHERE name IN ('supabase_url', 'service_role_key')
ORDER BY created_at DESC;

-- Step 4: Verify the cron job is scheduled
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'daily-blog-generation';

-- Step 5: (Optional) Test the function manually
-- Uncomment the line below to test it now:
-- SELECT trigger_daily_blog_generation();
