-- DB-backed admin registry and admin-only blog write policies.

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own admin row" ON admin_users;
CREATE POLICY "Users can read own admin row"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

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
GRANT SELECT ON admin_users TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;

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

DROP POLICY IF EXISTS "Authenticated users can read blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can update blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Authenticated users can insert blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Admins can read blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Admins can update blog generation state" ON blog_generation_state;
DROP POLICY IF EXISTS "Admins can insert blog generation state" ON blog_generation_state;

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

DROP POLICY IF EXISTS "Authenticated users can read used images" ON used_blog_images;
DROP POLICY IF EXISTS "Authenticated users can insert used images" ON used_blog_images;
DROP POLICY IF EXISTS "Admins can read used images" ON used_blog_images;

CREATE POLICY "Admins can read used images"
  ON used_blog_images FOR SELECT TO authenticated
  USING (public.is_admin());
