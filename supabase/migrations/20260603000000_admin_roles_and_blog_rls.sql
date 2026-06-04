/*
  # Admin roles + lock down blog write access

  ## Why
  `blog_posts`, `blog_generation_state`, and `used_blog_images` previously
  allowed ANY authenticated user to INSERT/UPDATE/DELETE
  (`USING (true) / WITH CHECK (true)`). Admin gating lived only inside the
  edge functions, which is bypassable: a regular signed-up user can call
  PostgREST directly with their anon-key JWT and tamper with blog content.
  RLS — not the edge function — is the real enforcement boundary for direct
  API access, so the gate has to live here.

  ## Changes
  - New table `admin_users` — the single source of truth for admin status.
  - Helper `public.is_admin()` (SECURITY DEFINER) for use in RLS policies and
    by the frontend/edge functions.
  - `blog_posts`: writes restricted to admins; public still reads published.
  - `blog_generation_state`: read/write restricted to admins.
  - `used_blog_images`: read restricted to admins; permissive write removed.

  Edge functions and the daily cron run on the SERVICE ROLE, which bypasses
  RLS entirely — so blog generation is unaffected by these policies.

  ## REQUIRED manual step after deploy
  Grant yourself admin (you will otherwise lose access to the admin panel):
  see `scripts/grant-admin.sql`.
*/

-- 1. Admin registry ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- A user may check whether THEY are an admin (the frontend needs this).
-- There are deliberately NO insert/update/delete policies: admin status can
-- only be granted/revoked via the service role or the SQL editor.
DROP POLICY IF EXISTS "Users can read own admin row" ON admin_users;
CREATE POLICY "Users can read own admin row"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2. Admin check helper ------------------------------------------------------
-- SECURITY DEFINER so RLS policies on other tables can consult admin_users
-- without the caller needing direct read access to every row.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = (select auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. blog_posts: admin-only writes ------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;

CREATE POLICY "Admins can insert blog posts"
  ON blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete blog posts"
  ON blog_posts FOR DELETE TO authenticated
  USING (public.is_admin());

-- (the existing public SELECT policy for published posts is left intact)

-- 4. blog_generation_state: admin-only --------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read blog generation state"   ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can update blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can insert blog generation state" ON blog_generation_state;

CREATE POLICY "Admins can read blog generation state"
  ON blog_generation_state FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update blog generation state"
  ON blog_generation_state FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert blog generation state"
  ON blog_generation_state FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 5. used_blog_images: admin-only read, no client writes --------------------
DROP POLICY IF EXISTS "Authenticated users can read used images"   ON used_blog_images;
DROP POLICY IF EXISTS "Authenticated users can insert used images" ON used_blog_images;

CREATE POLICY "Admins can read used images"
  ON used_blog_images FOR SELECT TO authenticated
  USING (public.is_admin());
-- Inserts happen only via the edge function (service role), which bypasses RLS.
