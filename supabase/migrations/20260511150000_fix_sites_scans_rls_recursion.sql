-- Fix recursive RLS between sites and scans.
--
-- The public scan flow allows a signed-in user to see a site when they have
-- claimed one of its scans. That made sites SELECT depend on scans, while
-- scans SELECT also depended on sites, causing PostgREST 500s on simple
-- dashboard queries.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.user_owns_site(check_site_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sites
    WHERE public.sites.id = check_site_id
      AND public.sites.user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION private.user_has_scan_for_site(check_site_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scans
    WHERE public.scans.site_id = check_site_id
      AND public.scans.user_id = check_user_id
  );
$$;

REVOKE ALL ON FUNCTION private.user_owns_site(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_has_scan_for_site(uuid, uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_owns_site(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_has_scan_for_site(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view own sites" ON sites;
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR private.user_has_scan_for_site(id, (select auth.uid()))
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
    OR private.user_owns_site(site_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create scans for own sites" ON scans;
CREATE POLICY "Users can create scans for own sites"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR private.user_owns_site(site_id, (select auth.uid()))
  );
