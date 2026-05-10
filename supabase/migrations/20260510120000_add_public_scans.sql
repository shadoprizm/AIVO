-- Extend sites and scans for anonymous public access.
ALTER TABLE sites ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('private', 'unlisted', 'public')) DEFAULT 'private';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS request_ip_hash TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS request_domain TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'dashboard';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS v2_score JSONB;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS v2_evidence JSONB;

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_public_token ON scans(public_token);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_sites_url ON sites(url);

DROP POLICY IF EXISTS "Users can view own sites" ON sites;
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM scans
      WHERE scans.site_id = sites.id
      AND scans.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own sites" ON sites;
CREATE POLICY "Users can create own sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own sites" ON sites;
CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sites" ON sites;
CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view scans for own sites" ON scans;
CREATE POLICY "Users can view scans for own sites"
  ON scans FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scans.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create scans for own sites" ON scans;
CREATE POLICY "Users can create scans for own sites"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scans.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

-- Public report access is intentionally not granted through RLS. Public token
-- lookups are served only by Edge Functions using the service role key.
