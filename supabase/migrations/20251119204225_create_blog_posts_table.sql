/*
  # Create Blog Posts Table

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text, required) - Blog post title
      - `slug` (text, unique, required) - URL-friendly slug
      - `excerpt` (text, required) - Short summary for listings
      - `content` (text, required) - Full blog post content (markdown)
      - `author_name` (text, required) - Author display name
      - `author_email` (text) - Author email (optional)
      - `cover_image_url` (text) - Optional cover image
      - `tags` (text array) - Post tags for categorization
      - `published` (boolean, default false) - Publication status
      - `published_at` (timestamptz) - Publication date
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `meta_description` (text) - SEO meta description
      - `reading_time_minutes` (integer) - Estimated reading time

  2. Security
    - Enable RLS on `blog_posts` table
    - Public can read published posts
    - Only authenticated users can create/update posts (for future admin functionality)

  3. Indexes
    - Index on slug for fast lookups
    - Index on published_at for sorting
    - Index on published for filtering
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text,
  cover_image_url text,
  tags text[] DEFAULT ARRAY[]::text[],
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  meta_description text,
  reading_time_minutes integer DEFAULT 5
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

CREATE POLICY "Authenticated users can insert blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update blog posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
