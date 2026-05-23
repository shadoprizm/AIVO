/*
  # Create rate_limits table for Edge Function throttling

  ## Summary
  Adds a `rate_limits` table used by Supabase Edge Functions to enforce
  per-IP sliding-window rate limits on publicly-callable endpoints
  (`run-scan`, `generate-blog`).

  ## Changes Made

  ### 1. New table `public.rate_limits`
  - `id uuid` primary key
  - `key text` composite of `<endpoint>:<ip>`
  - `window_start timestamptz` start of the current fixed window bucket
  - `count int` request count in the bucket
  - `created_at timestamptz`

  ### 2. Indexes
  - Unique on `(key, window_start)` so upserts collapse to one row per bucket
  - Btree on `window_start` to speed up cleanup

  ### 3. Row Level Security
  - RLS enabled
  - No policies created — only the service role (which bypasses RLS) may
    read or write. Edge Functions use the service role key.

  ### 4. Helper function `increment_rate_limit(p_key, p_window_start)`
  - SECURITY DEFINER, owned by postgres
  - Atomically inserts-or-increments the bucket and returns the new count
  - Used by the rate-limit Edge Function helper for a single round-trip check

  ### 5. Maintenance function `cleanup_rate_limits()`
  - Deletes rows whose `window_start` is older than one hour
  - Intended to be called periodically (e.g., from an existing pg_cron job)
*/

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_window_idx
  ON public.rate_limits (key, window_start);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key text,
  p_window_start timestamptz
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count int;
BEGIN
  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
$$;

REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
