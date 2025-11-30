/*
  # Add Used Images Tracking

  1. Changes
    - Creates a table to track which Pexels image URLs have been used
    - Ensures each blog post gets a unique cover image

  2. Security
    - Enable RLS on `used_blog_images` table
    - Only authenticated users can read/write
*/

CREATE TABLE IF NOT EXISTS used_blog_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL UNIQUE,
  photographer text,
  photographer_url text,
  used_at timestamptz DEFAULT now()
);

ALTER TABLE used_blog_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'used_blog_images'
    AND policyname = 'Authenticated users can read used images'
  ) THEN
    CREATE POLICY "Authenticated users can read used images"
      ON used_blog_images
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'used_blog_images'
    AND policyname = 'Authenticated users can insert used images'
  ) THEN
    CREATE POLICY "Authenticated users can insert used images"
      ON used_blog_images
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_used_blog_images_url ON used_blog_images(image_url);
CREATE INDEX IF NOT EXISTS idx_used_blog_images_used_at ON used_blog_images(used_at DESC);
