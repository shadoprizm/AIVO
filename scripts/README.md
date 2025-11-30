# Scripts Directory

This directory contains utility scripts for managing the AIVO project.

## Blog Automation Scripts

### Setup Daily Blog Cron Job

After deploying the `20251128000000_setup_daily_blog_cron.sql` migration, you need to configure the secrets:

1. **Go to your Supabase Dashboard**
   - Navigate to: SQL Editor

2. **Run the setup script**
   - Open and run: `scripts/setup-blog-cron-secrets.sql`
   - **IMPORTANT**: Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
   - Find your service role key at: Project Settings → API → service_role (secret)

3. **Verify the setup**
   - Run: `scripts/verify-blog-cron.sql`
   - This will show you the status of all components

### How It Works

The automated blog system:
- Runs every day at **10:00 AM UTC** (6 AM EST / 3 AM PST)
- Generates one blog post per day
- Rotates through 20 predefined topics
- Uses OpenAI to generate content
- Fetches unique cover images from Pexels
- Automatically publishes to your blog

### Manual Testing

To test the blog generation manually:

```sql
-- Run in Supabase SQL Editor
SELECT trigger_daily_blog_generation();
```

### Changing the Schedule

To change when blogs are generated:

```sql
-- Unschedule the current job
SELECT cron.unschedule('daily-blog-generation');

-- Schedule with new time (example: 2 PM UTC)
SELECT cron.schedule(
  'daily-blog-generation',
  '0 14 * * *',  -- 2 PM UTC
  $$SELECT trigger_daily_blog_generation();$$
);
```

### Cron Expression Examples

- `0 10 * * *` - 10:00 AM UTC daily (default)
- `0 14 * * *` - 2:00 PM UTC daily
- `0 0 * * *` - Midnight UTC daily
- `0 12 * * 1` - Noon UTC every Monday
- `0 9 * * 1-5` - 9:00 AM UTC weekdays only

### Troubleshooting

If blogs aren't being generated:

1. Run `scripts/verify-blog-cron.sql` to check the setup
2. Check that secrets are configured correctly
3. Verify the cron job is active
4. Check Supabase logs for errors
5. Test manually using `SELECT trigger_daily_blog_generation();`

### View Cron Job Logs

```sql
-- View cron job run history
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-blog-generation')
ORDER BY start_time DESC
LIMIT 10;
```
