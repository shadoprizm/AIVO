-- Admin moderation controls and RLS hardening.

CREATE TABLE IF NOT EXISTS user_moderation (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  reason text,
  suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_abuse_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type text NOT NULL CHECK (block_type IN ('user', 'domain', 'request_ip_hash', 'user_agent_hash')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text,
  request_ip_hash text,
  user_agent_hash text,
  reason text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  deactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deactivated_at timestamptz,
  CHECK (
    (block_type = 'user' AND user_id IS NOT NULL AND domain IS NULL AND request_ip_hash IS NULL AND user_agent_hash IS NULL)
    OR (block_type = 'domain' AND domain IS NOT NULL AND user_id IS NULL AND request_ip_hash IS NULL AND user_agent_hash IS NULL)
    OR (block_type = 'request_ip_hash' AND request_ip_hash IS NOT NULL AND user_id IS NULL AND domain IS NULL AND user_agent_hash IS NULL)
    OR (block_type = 'user_agent_hash' AND user_agent_hash IS NOT NULL AND user_id IS NULL AND domain IS NULL AND request_ip_hash IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_moderation_status ON user_moderation(status);
CREATE INDEX IF NOT EXISTS idx_admin_abuse_blocks_active ON admin_abuse_blocks(active);
CREATE INDEX IF NOT EXISTS idx_admin_abuse_blocks_user_id ON admin_abuse_blocks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_abuse_blocks_domain ON admin_abuse_blocks(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_abuse_blocks_request_ip_hash ON admin_abuse_blocks(request_ip_hash) WHERE request_ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_abuse_blocks_user_agent_hash ON admin_abuse_blocks(user_agent_hash) WHERE user_agent_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_user_id ON admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);

ALTER TABLE user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_abuse_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_feedback ENABLE ROW LEVEL SECURITY;

ALTER TABLE scan_feedback
  DROP CONSTRAINT IF EXISTS scan_feedback_public_token_fkey;

ALTER TABLE scan_feedback
  ADD CONSTRAINT scan_feedback_public_token_fkey
  FOREIGN KEY (public_token) REFERENCES scans(public_token) ON DELETE SET NULL;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_user_suspended(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.user_moderation
      WHERE user_id = check_user_id
        AND status = 'suspended'
        AND (expires_at IS NULL OR expires_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM public.admin_abuse_blocks
      WHERE user_id = check_user_id
        AND active = true
        AND (expires_at IS NULL OR expires_at > now())
    );
$$;

REVOKE ALL ON FUNCTION private.is_user_suspended(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_user_suspended(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view own sites" ON sites;
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    NOT private.is_user_suspended((select auth.uid()))
    AND (
      user_id = (select auth.uid())
      OR private.user_has_scan_for_site(id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create own sites" ON sites;
CREATE POLICY "Users can create own sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT private.is_user_suspended((select auth.uid()))
    AND user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own sites" ON sites;
CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    NOT private.is_user_suspended((select auth.uid()))
    AND user_id = (select auth.uid())
  )
  WITH CHECK (
    NOT private.is_user_suspended((select auth.uid()))
    AND user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own sites" ON sites;
CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  TO authenticated
  USING (
    NOT private.is_user_suspended((select auth.uid()))
    AND user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can view scans for own sites" ON scans;
CREATE POLICY "Users can view scans for own sites"
  ON scans FOR SELECT
  TO authenticated
  USING (
    NOT private.is_user_suspended((select auth.uid()))
    AND (
      user_id = (select auth.uid())
      OR private.user_owns_site(site_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create scans for own sites" ON scans;
CREATE POLICY "Users can create scans for own sites"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT private.is_user_suspended((select auth.uid()))
    AND (
      user_id = (select auth.uid())
      OR private.user_owns_site(site_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;

DROP POLICY IF EXISTS "Authenticated users can read blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can update blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can insert blog generation state" ON blog_generation_state;
