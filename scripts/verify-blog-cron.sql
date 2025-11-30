/*
  Verify Daily Blog Generation Setup

  Run this in your Supabase SQL Editor to check if everything is configured correctly.
*/

-- Check if required extensions are enabled
SELECT
  extname AS extension_name,
  extversion AS version
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net');

-- Check if the cron job is scheduled
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  (
    CASE
      WHEN active THEN '✅ Active'
      ELSE '❌ Inactive'
    END
  ) AS status
FROM cron.job
WHERE jobname = 'daily-blog-generation';

-- Check if secrets are configured (without revealing values)
SELECT
  name,
  description,
  created_at,
  '✅ Configured' AS status
FROM vault.secrets
WHERE name IN ('supabase_url', 'service_role_key')
ORDER BY name;

-- Check the function exists
SELECT
  routine_name,
  routine_type,
  '✅ Function exists' AS status
FROM information_schema.routines
WHERE routine_name = 'trigger_daily_blog_generation'
  AND routine_schema = 'public';

-- Check recent blog generation state
SELECT
  last_topic_index,
  last_generated_at,
  total_generated,
  updated_at,
  CASE
    WHEN last_generated_at IS NULL THEN '⚠️ No posts generated yet'
    WHEN last_generated_at::date = CURRENT_DATE THEN '✅ Post generated today'
    WHEN last_generated_at::date = CURRENT_DATE - INTERVAL '1 day' THEN '⏰ Post generated yesterday (waiting for today)'
    ELSE '⚠️ Last post was ' || (CURRENT_DATE - last_generated_at::date) || ' days ago'
  END AS generation_status
FROM blog_generation_state
ORDER BY updated_at DESC
LIMIT 1;

-- Check recent blog posts
SELECT
  title,
  published,
  published_at,
  created_at,
  CASE
    WHEN published_at::date = CURRENT_DATE THEN '✅ Published today'
    WHEN published_at::date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Published ' || (CURRENT_DATE - published_at::date) || ' days ago'
    ELSE 'Published on ' || published_at::date
  END AS status
FROM blog_posts
WHERE published = true
ORDER BY published_at DESC
LIMIT 5;

-- Summary
SELECT
  'Setup Status' AS check_type,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_extension WHERE extname = 'pg_cron') > 0
     AND (SELECT COUNT(*) FROM pg_extension WHERE extname = 'pg_net') > 0
     AND (SELECT COUNT(*) FROM cron.job WHERE jobname = 'daily-blog-generation') > 0
     AND (SELECT COUNT(*) FROM vault.secrets WHERE name IN ('supabase_url', 'service_role_key')) = 2
    THEN '✅ All components configured correctly'
    ELSE '⚠️ Some components are missing - check details above'
  END AS status;
