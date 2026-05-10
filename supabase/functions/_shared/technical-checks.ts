import { DiscoveredSite, Recommendation, TechnicalCheckResult, TechnicalFinding, TechnicalScores } from './analysis-types.ts';

const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended'];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function robotsAllowsBot(content: string, bot: string): boolean {
  const escapedBot = bot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`user-agent:\\s*(${escapedBot}|\\*)[\\s\\S]*?(?=\\n\\s*user-agent:|$)`, 'i');
  const block = content.match(blockRegex)?.[0] ?? '';
  if (!block) return false;

  const disallowAll = /disallow:\s*\/\s*(?:\n|$)/i.test(block);
  const explicitAllow = /allow:\s*\/\s*(?:\n|$)/i.test(block);
  return explicitAllow || !disallowAll;
}

function extractFirst(pattern: RegExp, html: string): string | null {
  return html.match(pattern)?.[1]?.trim() ?? null;
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>();
  const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    const raw = match[1];
    const typeMatches = raw.matchAll(/"@type"\s*:\s*"([^"]+)"/gi);
    for (const typeMatch of typeMatches) {
      types.add(typeMatch[1]);
    }
  }

  const microdataMatches = html.matchAll(/itemtype=["'][^"']*schema\.org\/([^"']+)["']/gi);
  for (const typeMatch of microdataMatches) {
    types.add(typeMatch[1]);
  }

  return Array.from(types);
}

function headingOrderValid(html: string): boolean {
  const headingRegex = /<h([1-6])\b/gi;
  let previous = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = Number(match[1]);
    if (previous > 0 && level > previous + 1) {
      return false;
    }
    previous = level;
  }

  return true;
}

function summarizeLlms(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

function addFinding(findings: TechnicalFinding[], finding: TechnicalFinding): void {
  findings.push(finding);
}

function addRecommendation(recommendations: Recommendation[], recommendation: Recommendation): void {
  recommendations.push(recommendation);
}

function weightedOverall(scores: Omit<TechnicalScores, 'overall'>): number {
  return clampScore(
    scores.crawl_access * 0.25 +
    scores.entity_clarity * 0.20 +
    scores.answer_readiness * 0.20 +
    scores.citation_likelihood * 0.15 +
    scores.trust_evidence * 0.15 +
    scores.competitive_presence * 0.05
  );
}

export function runTechnicalChecks(site: DiscoveredSite): TechnicalCheckResult {
  const findings: TechnicalFinding[] = [];
  const recommendations: Recommendation[] = [];
  const homepageHtml = site.homepage?.body ?? '';
  const robots = site.system_files.find((file) => file.type === 'robots');
  const llms = site.system_files.find((file) => file.type === 'llms');
  const sitemap = site.system_files.find((file) => file.type === 'sitemap');

  const allowedBots = robots ? AI_BOTS.filter((bot) => robotsAllowsBot(robots.content, bot)) : [];
  const blockedBots = robots ? AI_BOTS.filter((bot) => !robotsAllowsBot(robots.content, bot)) : AI_BOTS;
  const sitemapUrlCount = sitemap ? (sitemap.content.match(/<loc>/gi) ?? []).length : 0;
  const sitemapValidXml = Boolean(sitemap && /<urlset[\s>]/i.test(sitemap.content) && sitemapUrlCount > 0);
  const title = extractFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, homepageHtml);
  const metaDescription = extractFirst(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i, homepageHtml);
  const canonical = extractFirst(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i, homepageHtml);
  const schemaTypes = extractSchemaTypes(homepageHtml);
  const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(homepageHtml);
  const hasTwitterMetadata = /<meta[^>]+name=["']twitter:/i.test(homepageHtml);
  const h1Count = (homepageHtml.match(/<h1\b/gi) ?? []).length;
  const hasFaqSchema = schemaTypes.includes('FAQPage') || schemaTypes.includes('Question');
  const textOnly = homepageHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const csrShellRisk = /<div[^>]+id=["'](root|app|__next)["']/i.test(homepageHtml) && textOnly.length < 500;
  const validHeadingOrder = headingOrderValid(homepageHtml);

  addFinding(findings, {
    key: 'robots_ai_access',
    label: 'AI crawler access',
    passed: Boolean(robots && blockedBots.length === 0),
    severity: 'high',
    evidence: robots
      ? `${allowedBots.length} of ${AI_BOTS.length} tracked AI crawlers appear allowed.`
      : 'robots.txt was not found.',
  });

  addFinding(findings, {
    key: 'llms_txt',
    label: 'llms.txt',
    passed: Boolean(llms),
    severity: 'medium',
    evidence: llms ? `llms.txt found: ${summarizeLlms(llms.content)}` : 'llms.txt was not found.',
  });

  addFinding(findings, {
    key: 'sitemap',
    label: 'XML sitemap',
    passed: sitemapValidXml,
    severity: 'medium',
    evidence: sitemap ? `sitemap.xml found with ${sitemapUrlCount} URLs.` : 'sitemap.xml was not found.',
  });

  addFinding(findings, {
    key: 'metadata',
    label: 'Title and meta description',
    passed: Boolean(title && metaDescription),
    severity: 'medium',
    evidence: `Title: ${title || 'missing'}; meta description: ${metaDescription || 'missing'}.`,
  });

  addFinding(findings, {
    key: 'schema',
    label: 'Structured data',
    passed: schemaTypes.length > 0,
    severity: 'medium',
    evidence: schemaTypes.length ? `Detected schema types: ${schemaTypes.join(', ')}.` : 'No JSON-LD or schema.org itemtypes detected.',
  });

  addFinding(findings, {
    key: 'headings',
    label: 'Heading structure',
    passed: h1Count === 1 && validHeadingOrder,
    severity: 'medium',
    evidence: `${h1Count} H1 tag(s); heading order ${validHeadingOrder ? 'does not skip levels' : 'skips levels'}.`,
  });

  addFinding(findings, {
    key: 'csr_shell',
    label: 'Crawler-visible content',
    passed: !csrShellRisk,
    severity: 'high',
    evidence: csrShellRisk
      ? `Only ${textOnly.length} visible characters found around a client-side app shell.`
      : `${textOnly.length} visible characters found in initial HTML.`,
  });

  if (!robots || blockedBots.length > 0) {
    addRecommendation(recommendations, {
      title: 'Allow major AI crawlers in robots.txt',
      severity: 'high',
      evidence: robots ? `Blocked or unspecified bots: ${blockedBots.join(', ')}.` : 'robots.txt was not found.',
      why_it_matters: 'AI systems need crawl permission before they can reliably discover and cite public pages.',
      exact_fix: 'Publish robots.txt rules that allow GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, and Google-Extended unless a specific legal policy requires blocking them.',
      effort_estimate: 'low',
      owner: 'developer',
      expected_impact: 'Improves crawl access and citation eligibility.',
    });
  }

  if (!llms) {
    addRecommendation(recommendations, {
      title: 'Publish llms.txt',
      severity: 'medium',
      evidence: 'llms.txt was not found at the site root.',
      why_it_matters: 'A concise llms.txt file gives AI crawlers a clean summary of important pages and product claims.',
      exact_fix: 'Add /llms.txt with a product summary, key URLs, supported claims, exclusions, and contact information.',
      effort_estimate: 'low',
      owner: 'content',
      expected_impact: 'Improves entity clarity for AI crawlers.',
    });
  }

  if (!schemaTypes.length) {
    addRecommendation(recommendations, {
      title: 'Add schema.org structured data',
      severity: 'medium',
      evidence: 'No JSON-LD or schema.org itemtypes were detected on the homepage.',
      why_it_matters: 'Structured data helps AI systems identify the organization, page purpose, and answerable facts.',
      exact_fix: 'Add Organization and WebSite JSON-LD on the homepage, then add more specific types on service, product, article, and FAQ pages.',
      effort_estimate: 'medium',
      owner: 'developer',
      expected_impact: 'Improves entity clarity and answer readiness.',
    });
  }

  if (csrShellRisk) {
    addRecommendation(recommendations, {
      title: 'Render key content in initial HTML',
      severity: 'high',
      evidence: `Initial HTML has ${textOnly.length} visible characters and a client-side app shell marker.`,
      why_it_matters: 'Some crawlers and AI ingestion systems do not execute JavaScript consistently.',
      exact_fix: 'Prerender or server-render the homepage and key landing pages so headings, body copy, schema, and navigation appear in the initial HTML.',
      effort_estimate: 'high',
      owner: 'developer',
      expected_impact: 'Improves crawlability and answer readiness.',
    });
  }

  const baseScores = {
    crawl_access: clampScore((robots ? 45 : 15) + (allowedBots.length / AI_BOTS.length) * 35 + (sitemapValidXml ? 20 : 0)),
    entity_clarity: clampScore((title ? 20 : 0) + (metaDescription ? 20 : 0) + (canonical ? 10 : 0) + Math.min(schemaTypes.length * 15, 40) + (hasOpenGraph ? 10 : 0)),
    answer_readiness: clampScore((hasFaqSchema ? 35 : 0) + (h1Count === 1 ? 20 : 5) + (validHeadingOrder ? 20 : 0) + (site.detected_pages.faq.length ? 15 : 0) + (textOnly.length > 1200 ? 10 : 0)),
    citation_likelihood: clampScore((canonical ? 20 : 0) + (hasOpenGraph ? 15 : 0) + (hasTwitterMetadata ? 10 : 0) + (site.detected_pages.trust.length ? 20 : 0) + (schemaTypes.length ? 20 : 0) + (sitemapValidXml ? 15 : 0)),
    trust_evidence: clampScore((site.detected_pages.about.length ? 20 : 0) + (site.detected_pages.contact.length ? 20 : 0) + (site.detected_pages.trust.length ? 25 : 0) + (schemaTypes.includes('Organization') ? 20 : 0) + (llms ? 15 : 0)),
    competitive_presence: 50,
  };
  const scores: TechnicalScores = {
    ...baseScores,
    overall: weightedOverall(baseScores),
  };

  return {
    scores,
    findings,
    recommendations,
    evidence: {
      robots: {
        present: Boolean(robots),
        allowed_bots: allowedBots,
        blocked_bots: blockedBots,
      },
      llms: {
        present: Boolean(llms),
        summary: llms ? summarizeLlms(llms.content) : '',
      },
      sitemap: {
        present: Boolean(sitemap),
        valid_xml: sitemapValidXml,
        url_count: sitemapUrlCount,
      },
      html: {
        title,
        meta_description: metaDescription,
        canonical,
        schema_types: schemaTypes,
        has_open_graph: hasOpenGraph,
        has_twitter_metadata: hasTwitterMetadata,
        h1_count: h1Count,
        heading_order_valid: validHeadingOrder,
        has_faq_schema: hasFaqSchema,
        csr_shell_risk: csrShellRisk,
      },
    },
  };
}
