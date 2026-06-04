/*
  Grant Admin Access

  Admin status is now stored in the `admin_users` table (see migration
  20260603000000_admin_roles_and_blog_rls.sql) instead of an email allowlist
  baked into the client bundle.

  Run this in your Supabase SQL Editor AFTER applying the migration to grant
  yourself (or a teammate) admin rights. Without this step, no one can manage
  blog content from the admin panel.
*/

-- Option A — grant by email (simplest):
INSERT INTO admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'you@example.com'   -- ⚠️ REPLACE with your account email
ON CONFLICT (user_id) DO NOTHING;

-- Option B — grant by user id (if you know it):
-- INSERT INTO admin_users (user_id)
-- VALUES ('00000000-0000-0000-0000-000000000000')
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify who currently has admin:
SELECT u.email, a.created_at
FROM admin_users a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at;

-- To REVOKE admin from someone:
-- DELETE FROM admin_users
-- USING auth.users u
-- WHERE admin_users.user_id = u.id
--   AND u.email = 'someone@example.com';
