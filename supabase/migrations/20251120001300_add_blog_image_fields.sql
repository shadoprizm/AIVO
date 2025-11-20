/*
  # Enrich blog posts with image attribution metadata

  1. Changes
    - Adds columns to store cover image source + attribution info
    - Ensures HTML content has an explicit flag for easier filtering

  2. Notes
    - Existing rows keep NULL defaults
*/

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS content_format text DEFAULT 'html',
  ADD COLUMN IF NOT EXISTS image_source text,
  ADD COLUMN IF NOT EXISTS image_author text,
  ADD COLUMN IF NOT EXISTS image_author_url text;
