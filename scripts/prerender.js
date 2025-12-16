import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const routes = [
    '/',
    '/how-it-works',
    '/faq',
    '/blog',
    '/privacy',
    '/terms',
    '/login',
    '/signup'
];

function envFlag(name) {
    const value = process.env[name];
    if (!value) return false;
    return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

function isVercel() {
    return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

async function prerender() {
    console.log('Starting prerendering...');

    // Puppeteer/Chrome often can't run in Vercel's build container due to missing system libraries.
    // Allow builds to succeed by skipping prerender on Vercel (or when explicitly disabled).
    if (isVercel() || envFlag('SKIP_PRERENDER')) {
        console.log('Skipping prerender (VERCEL or SKIP_PRERENDER is set).');
        process.exit(0);
    }

    // Start a static server serving the dist folder
    // We use 'preview' command from vite
    const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
        stdio: 'inherit',
        shell: true
    });

    let browser;
    try {
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    } catch (error) {
        console.error('Prerender setup failed (server or browser launch):', error);
        server.kill();
        process.exit(1);
    }

    try {
        for (const route of routes) {
            console.log(`Prerendering ${route}...`);
            const page = await browser.newPage();

            // Navigate to the route
            await page.goto(`http://localhost:4173${route}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Wait for some content to ensure React has hydrated
            // We look for the footer or main content
            try {
                await page.waitForSelector('footer', { timeout: 5000 });
            } catch (e) {
                console.warn(`Warning: Timeout waiting for footer on ${route}`);
            }

            // Get the HTML
            const html = await page.content();

            // Define output path
            // If route is /, output is index.html
            // If route is /faq, output is faq/index.html
            const relativePath = route === '/' ? 'index.html' : `${route.substring(1)}/index.html`;
            const outputPath = path.join(distDir, relativePath);
            const outputDir = path.dirname(outputPath);

            // Ensure directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Write HTML
            fs.writeFileSync(outputPath, html);
            console.log(`Generated ${relativePath}`);

            await page.close();
        }
    } catch (error) {
        console.error('Prerendering failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
        server.kill();
        console.log('Prerendering complete.');
        process.exit(0);
    }
}

prerender();
