/*
  # Create AIVO Insights Core Schema

  ## Summary
  This migration creates the foundational database structure for AIVO Insights, enabling users to register websites and track AI visibility analysis scans.

  ## New Tables
  
  ### `sites`
  Stores user-registered websites for AI visibility analysis.
  - `id` (uuid, primary key) - Unique identifier for each site
  - `user_id` (uuid, foreign key) - References auth.users, owner of the site
  - `name` (text) - User-friendly name for the site
  - `url` (text) - The website URL to analyze
  - `created_at` (timestamptz) - When the site was registered
  - `last_scanned_at` (timestamptz, nullable) - Timestamp of most recent scan completion

  ### `scans`
  Stores individual analysis runs for each site.
  - `id` (uuid, primary key) - Unique identifier for each scan
  - `site_id` (uuid, foreign key) - References sites.id
  - `status` (text) - Current scan state: 'pending', 'processing', 'completed', 'failed'
  - `overall_score` (integer, nullable) - AIVO Score (0-100), populated on completion
  - `created_at` (timestamptz) - When the scan was initiated
  - `completed_at` (timestamptz, nullable) - When the scan finished (success or failure)

  ## Security (Row Level Security)
  
  ### Sites Table
  - Enable RLS to ensure data isolation
  - Users can only read their own sites
  - Users can only create sites for themselves
  - Users can only update their own sites
  - Users can only delete their own sites

  ### Scans Table
  - Enable RLS to ensure data isolation
  - Users can only read scans for sites they own
  - Users can only create scans for sites they own
  - No direct updates or deletes (scans are immutable after creation)
  - Updates handled via backend functions only

  ## Important Notes
  1. All timestamps use `timestamptz` for timezone awareness
  2. Foreign key constraints ensure referential integrity
  3. Cascading deletes: deleting a site removes all its scans
  4. RLS policies enforce strict user-level data isolation
  5. Default values ensure required fields are never null
*/

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_scanned_at timestamptz
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_site_id ON scans(site_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Sites policies
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scans policies
CREATE POLICY "Users can view scans for own sites"
  ON scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scans.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scans for own sites"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scans.site_id
      AND sites.user_id = auth.uid()
    )
  );
