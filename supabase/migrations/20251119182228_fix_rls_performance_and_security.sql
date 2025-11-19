/*
  # Fix RLS Performance and Security Issues

  ## Summary
  This migration optimizes Row Level Security policies for better performance at scale and removes unused indexes.

  ## Changes Made

  ### 1. RLS Policy Performance Optimization
  All RLS policies now use `(select auth.uid())` instead of `auth.uid()` to prevent re-evaluation for each row.
  This provides significant performance improvements when querying large datasets.

  **Sites Table Policies Updated:**
  - "Users can view own sites" - Optimized SELECT policy
  - "Users can create own sites" - Optimized INSERT policy
  - "Users can update own sites" - Optimized UPDATE policy
  - "Users can delete own sites" - Optimized DELETE policy

  **Scans Table Policies Updated:**
  - "Users can view scans for own sites" - Optimized SELECT policy with subquery
  - "Users can create scans for own sites" - Optimized INSERT policy with subquery

  ### 2. Remove Unused Indexes
  - Drop `idx_scans_status` - Not currently used by queries
  - Drop `idx_scans_analysis_json` - GIN index not needed for current query patterns

  ## Performance Impact
  - RLS policies will now cache auth.uid() once per query instead of per row
  - Reduced index maintenance overhead by removing unused indexes
  - Overall query performance improvement for multi-row operations

  ## Security
  - RLS remains fully enforced with same security guarantees
  - Users still cannot access data from other users
  - All policies maintain strict data isolation
*/

-- Drop and recreate sites table policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Users can view own sites" ON sites;
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own sites" ON sites;
CREATE POLICY "Users can create own sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sites" ON sites;
CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sites" ON sites;
CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate scans table policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Users can view scans for own sites" ON scans;
CREATE POLICY "Users can view scans for own sites"
  ON scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
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
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scans.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

-- Remove unused indexes to reduce maintenance overhead

DROP INDEX IF EXISTS idx_scans_status;
DROP INDEX IF EXISTS idx_scans_analysis_json;
