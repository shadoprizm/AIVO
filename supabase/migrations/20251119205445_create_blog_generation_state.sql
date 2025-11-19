/*
  # Create Blog Generation State Table

  1. New Tables
    - `blog_generation_state`
      - `id` (uuid, primary key)
      - `last_topic_index` (integer, default 0) - Tracks which topic was last used
      - `last_generated_at` (timestamptz) - When the last blog was generated
      - `total_generated` (integer, default 0) - Total count of generated blogs
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `blog_generation_state` table
    - Only authenticated users can read/update (for admin purposes)
    - Public cannot access

  3. Notes
    - This is a singleton table (only one row should exist)
    - Used to track the rotation state of blog topics
*/

CREATE TABLE IF NOT EXISTS blog_generation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_topic_index integer DEFAULT 0,
  last_generated_at timestamptz,
  total_generated integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_generation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read blog generation state"
  ON blog_generation_state
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update blog generation state"
  ON blog_generation_state
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert blog generation state"
  ON blog_generation_state
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert initial state row
INSERT INTO blog_generation_state (last_topic_index, total_generated)
VALUES (0, 0)
ON CONFLICT DO NOTHING;
