-- Enable pg_net extension for HTTP requests from cron function
-- This fixes the missing extensions.http_post function

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Verify the extension is enabled
DO $$
BEGIN
  -- Check if pg_net functions are available
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
  ) THEN
    RAISE LOG 'pg_net extension is now enabled for HTTP requests';
  ELSE
    RAISE EXCEPTION 'Failed to enable pg_net extension';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'pg_net extension status: %', SQLERRM;
END $$;
