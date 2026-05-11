export const INDEXABLE_STATIC_ROUTES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/free-ai-visibility-checker', changefreq: 'monthly', priority: '0.9' },
    { path: '/chatgpt-seo-checker', changefreq: 'monthly', priority: '0.9' },
    { path: '/ai-citation-checker', changefreq: 'monthly', priority: '0.9' },
    { path: '/llms-txt-checker', changefreq: 'monthly', priority: '0.85' },
    { path: '/ai-crawler-robots-txt-checker', changefreq: 'monthly', priority: '0.85' },
    { path: '/geo-audit-checklist', changefreq: 'monthly', priority: '0.85' },
    { path: '/sample-audits', changefreq: 'monthly', priority: '0.75' },
    { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
    { path: '/faq', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/signup', changefreq: 'monthly', priority: '0.9' },
    { path: '/login', changefreq: 'monthly', priority: '0.5' },
];

export const APP_ROUTES_EXCLUDED_FROM_SITEMAP = [
    { path: '/blog/:slug', reason: 'Published blog post URLs are fetched from Supabase at build time.' },
    { path: '/report/:token', reason: 'Public report token URLs are noindex and should not be submitted.' },
    { path: '/dashboard', reason: 'Authenticated dashboard route.' },
    { path: '/sites/:siteId', reason: 'Authenticated site detail route.' },
    { path: '/admin/blog', reason: 'Authenticated admin route.' },
];

export const SITEMAP_STATIC_ROUTES = INDEXABLE_STATIC_ROUTES.map(({ path, changefreq, priority }) => ({
    path,
    changefreq,
    priority,
}));

export const PRERENDER_ROUTES = INDEXABLE_STATIC_ROUTES.map(({ path }) => path);
