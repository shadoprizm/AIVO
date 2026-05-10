import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Production fallback is intentionally centralized here for the Node sitemap build.
const BASE_URL = (process.env.VITE_SITE_URL || 'https://aivoinsights.com').replace(/\/$/, '');

const STATIC_ROUTES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
    { path: '/faq', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/signup', changefreq: 'monthly', priority: '0.9' },
    { path: '/login', changefreq: 'monthly', priority: '0.5' },
];

function buildSitemap(posts = []) {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Absolute production URLs are required by the sitemap protocol and come from VITE_SITE_URL or the documented production fallback. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

    STATIC_ROUTES.forEach(route => {
        sitemap += `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

    posts.forEach(post => {
        const lastMod = post.updated_at || post.published_at || new Date().toISOString();
        sitemap += `
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';
    return sitemap;
}

function writeSitemap(sitemap) {
    const publicDir = path.resolve(__dirname, '../public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Sitemap generated successfully at ${sitemapPath}`);
}

async function generateSitemap() {
    console.log('Generating sitemap...');

    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Generating static sitemap only.');
            writeSitemap(buildSitemap());
            return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Fetch blog posts
        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('slug, updated_at, published_at')
            .eq('published', true)
            .order('published_at', { ascending: false });

        if (error) {
            throw error;
        }

        console.log(`Found ${posts?.length || 0} blog posts.`);

        writeSitemap(buildSitemap(posts || []));

    } catch (err) {
        console.warn('Warning: failed to fetch dynamic sitemap entries. Generating static sitemap only.', err);
        writeSitemap(buildSitemap());
    }
}

generateSitemap();
