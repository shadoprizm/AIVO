import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { SITEMAP_STATIC_ROUTES } from './seo-routes.js';

// Load environment variables without noisy dotenv tips in build logs.
dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Production fallback is intentionally centralized here for the Node sitemap build.
const BASE_URL = (process.env.VITE_SITE_URL || 'https://aivoinsights.com').replace(/\/$/, '');

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
}

function normalizeSlug(slug) {
    return String(slug ?? '').trim().replace(/^\/+|\/+$/g, '');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
}

function buildSitemap(posts = []) {
    const uniquePosts = [];
    const seenSlugs = new Set();
    for (const post of posts) {
        const slug = normalizeSlug(post?.slug);
        if (!slug || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        uniquePosts.push({ ...post, slug });
    }

    const buildDate = formatDate();
    const staticEntries = SITEMAP_STATIC_ROUTES.map(route => urlEntry({
        loc: `${BASE_URL}${route.path}`,
        lastmod: buildDate,
        changefreq: route.changefreq,
        priority: route.priority,
    }));

    const blogEntries = uniquePosts.map(post => {
        const lastMod = post.updated_at || post.published_at || post.created_at || new Date().toISOString();
        return urlEntry({
            loc: `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`,
            lastmod: formatDate(lastMod),
            changefreq: 'monthly',
            priority: '0.7',
        });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Absolute production URLs are required by the sitemap protocol and come from VITE_SITE_URL or the documented production fallback. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...blogEntries].join('\n')}
</urlset>`;
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
            .select('slug, updated_at, published_at, created_at')
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
