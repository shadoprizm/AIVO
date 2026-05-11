import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_ROUTES_EXCLUDED_FROM_SITEMAP, SITEMAP_STATIC_ROUTES } from './seo-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPath = path.resolve(__dirname, '../src/App.tsx');

function extractAppRoutes() {
    const appSource = fs.readFileSync(appPath, 'utf8');
    const routes = new Set();
    const routePattern = /<Route\s+[^>]*path="([^"]+)"/g;
    let match;

    while ((match = routePattern.exec(appSource)) !== null) {
        routes.add(match[1]);
    }

    return Array.from(routes).sort();
}

const sitemapRoutes = new Set(SITEMAP_STATIC_ROUTES.map(route => route.path));
const excludedRoutes = new Set(APP_ROUTES_EXCLUDED_FROM_SITEMAP.map(route => route.path));
const appRoutes = extractAppRoutes();
const undocumentedRoutes = appRoutes.filter(route => !sitemapRoutes.has(route) && !excludedRoutes.has(route));

if (undocumentedRoutes.length > 0) {
    console.error('SEO route validation failed. These App routes must be added to the sitemap or explicitly excluded:');
    undocumentedRoutes.forEach(route => console.error(`- ${route}`));
    process.exit(1);
}

console.log(`SEO route validation passed for ${appRoutes.length} App routes.`);
