import { fetchWithTimeout } from './fetch.ts';
import { DiscoveredSite, FetchedResource, SystemFile } from './analysis-types.ts';

const PAGE_TIMEOUT_MS = 8000;
const MAX_BYTES = 1_000_000;

async function fetchTextResource(url: string, maxBytes = MAX_BYTES): Promise<FetchedResource> {
  const response = await fetchWithTimeout(url, { method: 'GET' }, PAGE_TIMEOUT_MS, maxBytes);
  const body = await response.text();

  return {
    url,
    status: response.status,
    bytes: Number(response.headers.get('x-aivo-bytes-read') ?? body.length),
    contentType: response.headers.get('content-type') ?? '',
    body,
    truncated: response.headers.get('x-aivo-truncated') === 'true',
  };
}

function extractLinks(html: string, baseUrl: URL): string[] {
  const links = new Set<string>();
  const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const parsed = new URL(match[1], baseUrl);
      parsed.hash = '';
      if (parsed.origin === baseUrl.origin && parsed.protocol === 'https:') {
        links.add(parsed.toString());
      }
    } catch {
      // Ignore malformed links discovered in crawled HTML.
    }
  }

  return Array.from(links);
}

function parseSitemapUrls(xml: string): string[] {
  const entries: { loc: string; priority: number }[] = [];
  const urlRegex = /<url\b[\s\S]*?<\/url>/gi;
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/i;
  const priorityRegex = /<priority>\s*([0-9.]+)\s*<\/priority>/i;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(xml)) !== null) {
    const block = match[0];
    const loc = block.match(locRegex)?.[1]?.trim();
    if (!loc) continue;

    entries.push({
      loc,
      priority: Number(block.match(priorityRegex)?.[1] ?? '0.5'),
    });
  }

  return entries
    .sort((first, second) => second.priority - first.priority)
    .slice(0, 5)
    .map((entry) => entry.loc);
}

function detectPages(urls: string[]) {
  const detected = {
    about: [] as string[],
    contact: [] as string[],
    trust: [] as string[],
    faq: [] as string[],
    product_or_service: [] as string[],
  };

  urls.forEach((url) => {
    const path = new URL(url).pathname.toLowerCase();
    if (path.includes('about')) detected.about.push(url);
    if (path.includes('contact')) detected.contact.push(url);
    if (path.includes('trust') || path.includes('security') || path.includes('privacy')) detected.trust.push(url);
    if (path.includes('faq') || path.includes('frequently-asked')) detected.faq.push(url);
    if (path.includes('product') || path.includes('service') || path.includes('solutions')) {
      detected.product_or_service.push(url);
    }
  });

  return detected;
}

async function fetchSystemFile(baseUrl: URL, type: SystemFile['type'], path: string): Promise<SystemFile | null> {
  const url = new URL(path, baseUrl).toString();
  try {
    const resource = await fetchTextResource(url, 100_000);
    if (resource.status >= 400) return null;
    return {
      type,
      url,
      status: resource.status,
      content: resource.body,
    };
  } catch {
    return null;
  }
}

export async function discoverSite(normalizedUrl: string, maxHtmlPages = 6): Promise<DiscoveredSite> {
  const baseUrl = new URL(normalizedUrl);
  const failedPages: { url: string; error: string }[] = [];
  const systemFiles: SystemFile[] = [];
  const crawlWarnings: string[] = [];
  let homepage: FetchedResource | null = null;

  try {
    homepage = await fetchTextResource(baseUrl.toString());
  } catch (error) {
    failedPages.push({
      url: baseUrl.toString(),
      error: error instanceof Error ? error.message : 'Failed to fetch homepage',
    });
  }

  const files = await Promise.all(([['robots', '/robots.txt'], ['llms', '/llms.txt'], ['sitemap', '/sitemap.xml']] as const).map(([type, path]) => fetchSystemFile(baseUrl, type, path)));
  systemFiles.push(...files.filter((f): f is SystemFile => f !== null));

  const sitemap = systemFiles.find((file) => file.type === 'sitemap');
  const sitemapUrls = sitemap ? parseSitemapUrls(sitemap.content) : [];
  const homepageLinks = homepage ? extractLinks(homepage.body, baseUrl) : [];
  const candidateUrls = Array.from(new Set([baseUrl.toString(), ...sitemapUrls, ...homepageLinks]))
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.origin === baseUrl.origin;
      } catch {
        return false;
      }
    });

  const detectedPages = detectPages(candidateUrls);
  const priority = [...detectedPages.product_or_service, ...detectedPages.about, ...detectedPages.faq, ...detectedPages.contact];
  const pageUrls = Array.from(new Set([baseUrl.toString(), ...priority, ...candidateUrls])).slice(0, maxHtmlPages);
  const pages: FetchedResource[] = [];

  const captures = await Promise.all(pageUrls.map(async (pageUrl) => {
    try {
      const page = homepage && pageUrl === homepage.url ? homepage : await fetchTextResource(pageUrl);
      if (page.status < 200 || page.status >= 300 || !(page.contentType.includes('text/html') || page.body.includes('<html'))) throw new Error(`Page unavailable or not HTML (HTTP ${page.status})`);
      if (page.truncated) crawlWarnings.push(`${pageUrl}: HTML capture exceeded ${MAX_BYTES} bytes; coverage is incomplete.`);
      return page;
    } catch (error) {
      failedPages.push({ url: pageUrl, error: error instanceof Error ? error.message : 'Failed to fetch page' });
      return null;
    }
  }));
  pages.push(...captures.filter((p): p is FetchedResource => p !== null));

  if (!systemFiles.some((file) => file.type === 'robots')) {
    crawlWarnings.push('robots.txt was not found.');
  }
  if (!systemFiles.some((file) => file.type === 'sitemap')) {
    crawlWarnings.push('sitemap.xml was not found.');
  }

  return {
    input_url: normalizedUrl,
    normalized_url: baseUrl.toString(),
    domain: baseUrl.hostname,
    homepage,
    pages,
    system_files: systemFiles,
    sitemap_urls: sitemapUrls,
    detected_pages: detectedPages,
    evidence: {
      discovered_pages: candidateUrls,
      fetched_pages: pages.map((page) => ({ url: page.url, bytes: page.bytes, status: page.status })),
      failed_pages: failedPages,
      system_files: systemFiles,
      crawl_warnings: crawlWarnings,
    },
  };
}
