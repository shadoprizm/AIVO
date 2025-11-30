import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  siteId: string;
}

interface CategoryScores {
  content_clarity: number;
  semantic_structure: number;
  schema_metadata: number;
  qa_readiness: number;
  authority_trust: number;
  technical_accessibility: number;
}

type CategoryKey = keyof CategoryScores;

interface CategoryFeedback {
  score_reason: string;
  improvement_path: string;
}

interface Recommendation {
  id: string;
  category: keyof CategoryScores;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggested_fix: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

interface AnalysisJson {
  overall_score: number;
  category_scores: CategoryScores;
  category_feedback: Record<CategoryKey, CategoryFeedback>;
  recommendations: Recommendation[];
  notes?: string[];
  warnings?: string[];
  faq_findings?: FaqFinding[];
  analyzed_at: string;
  analysis_version: string;
}

interface FaqFinding {
  url: string;
  content_length: number;
  has_faq_schema: boolean;
  has_question_schema: boolean;
  question_like_blocks: number;
  adequacy: 'strong' | 'weak' | 'missing';
  summary: string;
}

// Helper to check if a URL exists
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    let res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'AIVO-Insights-Bot/1.0' }
    });
    // Some servers block HEAD; retry with GET if non-2xx
    if (!res.ok) {
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'AIVO-Insights-Bot/1.0' }
      });
    }
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

// Helper to fetch and parse sitemap
async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'AIVO-Insights-Bot/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const text = await response.text();
    const urls: string[] = [];
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;

    while ((match = locRegex.exec(text)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  } catch {
    return [];
  }
}

function normalizeLinkToSameOrigin(link: string, baseUrl: URL): string | null {
  try {
    const normalized = new URL(link, baseUrl);
    if (normalized.origin === baseUrl.origin) {
      return normalized.toString();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchPageContent(url: string, timeoutMs = 7000): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AIVO-Insights-Bot/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return '';
    const text = await res.text();
    return text.length > 80000 ? text.slice(0, 80000) : text;
  } catch {
    return '';
  }
}

function analyzeFaqContent(content: string): { finding: FaqFinding; qualityScore: number } {
  const textOnly = content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '').replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, '');
  const questionLikeBlocks = (textOnly.match(/\?\s*</g) || []).length;
  const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(content);
  const hasQuestionSchema = /"@type"\s*:\s*"Question"/i.test(content) && /"acceptedAnswer"/i.test(content);
  const faqHeadings = (textOnly.match(/FAQ|Frequently Asked Questions/gi) || []).length;
  const contentLength = textOnly.replace(/<[^>]+>/g, ' ').trim().length;

  let qualityScore = 0;
  if (contentLength > 500) qualityScore += 20;
  if (contentLength > 1500) qualityScore += 15;
  if (questionLikeBlocks >= 3) qualityScore += 25;
  if (questionLikeBlocks >= 8) qualityScore += 10;
  if (hasFaqSchema) qualityScore += 20;
  if (hasQuestionSchema) qualityScore += 10;
  if (faqHeadings > 0) qualityScore += 10;
  if (contentLength === 0) qualityScore = 0;

  let adequacy: FaqFinding['adequacy'] = 'missing';
  if (qualityScore >= 60) {
    adequacy = 'strong';
  } else if (qualityScore > 0) {
    adequacy = 'weak';
  }

  const summary = [
    `Length: ${contentLength} chars`,
    `Questions detected: ${questionLikeBlocks}`,
    hasFaqSchema ? 'FAQ schema present' : 'FAQ schema missing',
    hasQuestionSchema ? 'Question/Answer schema present' : 'Question/Answer schema missing',
  ].join(' | ');

  return {
    finding: {
      url: '',
      content_length: contentLength,
      has_faq_schema: hasFaqSchema,
      has_question_schema: hasQuestionSchema,
      question_like_blocks: questionLikeBlocks,
      adequacy,
      summary,
    },
    qualityScore,
  };
}

const categoryKeys: CategoryKey[] = [
  'content_clarity',
  'semantic_structure',
  'schema_metadata',
  'qa_readiness',
  'authority_trust',
  'technical_accessibility',
];

function ensureCategoryFeedback(category_scores: CategoryScores, provided?: Partial<Record<CategoryKey, CategoryFeedback>>): Record<CategoryKey, CategoryFeedback> {
  const feedback: Record<CategoryKey, CategoryFeedback> = {} as Record<CategoryKey, CategoryFeedback>;

  categoryKeys.forEach((key) => {
    const score = category_scores[key];
    const existing = provided?.[key];
    feedback[key] = {
      score_reason: existing?.score_reason || `Score set to ${score} based on detected signals and content quality.`,
      improvement_path: existing?.improvement_path || (score === 100
        ? 'Maintain current quality signals and monitor for regressions.'
        : 'Address the noted gaps to raise this category to 100.'),
    };
  });

  return feedback;
}

function sanitizeFaqRecommendations(
  recommendations: Recommendation[] | undefined,
  faqAdequacy: FaqFinding['adequacy'],
  isCsrShell: boolean
): Recommendation[] {
  const recs = recommendations ? [...recommendations] : [];

  // Remove any "Add FAQ" recs if we detected an FAQ page (even if weak)
  const filtered = recs.filter(rec => {
    const normalizedTitle = rec.title.toLowerCase();
    const normalizedDesc = rec.description.toLowerCase();
    const mentionsFaq = normalizedTitle.includes('faq') || normalizedDesc.includes('faq');
    const mentionsAdd = normalizedTitle.includes('add') || normalizedDesc.includes('add');
    if (mentionsFaq && mentionsAdd && faqAdequacy !== 'missing') {
      return false;
    }
    return true;
  });

  // Add "Verify FAQ visibility" if FAQ exists but is weak/CSR
  const needsVerifyFaq = faqAdequacy !== 'missing' && (faqAdequacy !== 'strong' || isCsrShell);
  const alreadyHasVerify = filtered.some(rec =>
    rec.id === 'rec-verify-faq-visibility' || rec.title.toLowerCase().includes('faq') && rec.title.toLowerCase().includes('visibility')
  );

  if (needsVerifyFaq && !alreadyHasVerify) {
    filtered.push({
      id: 'rec-verify-faq-visibility',
      category: 'qa_readiness',
      severity: isCsrShell ? 'high' : 'medium',
      title: 'Verify FAQ Visibility',
      description: 'FAQ content exists but may be hidden from crawlers (CSR or weak markup).',
      suggested_fix: 'Ensure the FAQ page renders server-side or is prerendered, and add FAQPage schema with clear question/answer pairs.',
      implementation_effort: isCsrShell ? 'high' : 'medium',
    });
  }

  return filtered;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { siteId }: RequestBody = await req.json();

    if (!siteId) {
      throw new Error('Missing siteId');
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (siteError || !site) {
      throw new Error('Site not found or unauthorized');
    }

    const recentScansResult = await supabase
      .from('scans')
      .select('created_at')
      .eq('site_id', siteId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentScansResult.data && recentScansResult.data.length >= 5) {
      throw new Error('Rate limit: Maximum 5 scans per hour per site');
    }

    const { data: newScan, error: insertError } = await supabase
      .from('scans')
      .insert({
        site_id: siteId,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !newScan) {
      throw new Error('Failed to create scan');
    }

    let htmlContent = '';
    let fetchError = null;
    const detectedPages: string[] = [];
    const detectedFiles: string[] = [];
    const faqFindings: FaqFinding[] = [];
    let faqLinkFound = false;
    let isCsrShell = false;

    try {
      const response = await fetch(site.url, {
        headers: {
          'User-Agent': 'AIVO-Insights-Bot/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        htmlContent = await response.text();
        if (htmlContent.length > 100000) {
          htmlContent = htmlContent.substring(0, 100000);
        }

        // Check for CSR Shell
        // Typical signs: <div id="root"> or <div id="app">, very short content, script tags but no visible text
        const rootDiv = /<div id=["'](root|app|__next)["']/.test(htmlContent);
        const bodyLength = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "").replace(/<[^>]+>/g, "").trim().length;

        if (rootDiv && bodyLength < 500) {
          isCsrShell = true;
        }

        // 1. Extract links from HTML to find internal pages
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
        let match;
        const links = new Set<string>();
        let faqLinkFound = false;
        while ((match = linkRegex.exec(htmlContent)) !== null) {
          links.add(match[1]);
          if (match[1].toLowerCase().includes('faq')) {
            faqLinkFound = true;
          }
        }

        // 2. Fetch Sitemap
        const sitemapUrls = await fetchSitemap(site.url);
        if (sitemapUrls.length > 0) {
          detectedFiles.push('sitemap.xml');
          sitemapUrls.forEach(url => links.add(url));
          if (sitemapUrls.some(url => url.toLowerCase().includes('faq'))) {
            faqLinkFound = true;
          }
        }

        const baseUrl = new URL(site.url);
        const faqCandidates = new Set<string>();

        // Normalize links and capture any FAQ-like paths for deeper inspection
        for (const rawLink of Array.from(links)) {
          const normalized = normalizeLinkToSameOrigin(rawLink, baseUrl);
          if (!normalized && rawLink.toLowerCase().includes('faq')) {
            faqLinkFound = true;
            continue;
          }
          if (!normalized) continue;
          const urlObj = new URL(normalized);
          const path = urlObj.pathname.toLowerCase();
          if (path.includes('/faq') || path.includes('frequently-asked-questions') || path.includes('/faqs') || rawLink.toLowerCase().includes('#faq')) {
            faqCandidates.add(normalized);
          }
        }

        // Check for common pages in links or by direct check
        const commonPaths = [
          { path: '/faq', name: 'FAQ Page' },
          { path: '/frequently-asked-questions', name: 'FAQ Page' },
          { path: '/blog', name: 'Blog' },
          { path: '/about', name: 'About Page' },
          { path: '/contact', name: 'Contact Page' },
          { path: '/privacy', name: 'Privacy Policy' },
          { path: '/terms', name: 'Terms of Service' }
        ];

        const systemFiles = [
          { path: '/robots.txt', name: 'robots.txt' },
        ];

        // Check system files
        for (const file of systemFiles) {
          const fileUrl = new URL(file.path, baseUrl).toString();
          if (await checkUrlExists(fileUrl)) {
            detectedFiles.push(file.name);
          }
        }

        // Check common pages
        // First check if they are linked in the homepage
        for (const page of commonPaths) {
          const isLinked = Array.from(links).some(link =>
            link.includes(page.path) || link.toLowerCase().includes(page.name.toLowerCase())
          );

          if (isLinked) {
            detectedPages.push(page.name);
            const normalized = normalizeLinkToSameOrigin(page.path, baseUrl);
            if (normalized && page.name.includes('FAQ')) {
              faqCandidates.add(normalized);
            }
          } else {
            // If not linked, try to fetch it to see if it exists
            const pageUrl = new URL(page.path, baseUrl).toString();
            if (await checkUrlExists(pageUrl)) {
              detectedPages.push(`${page.name} (detected but not clearly linked)`);
              if (page.name.includes('FAQ')) {
                faqCandidates.add(pageUrl);
              }
            }
          }
        }

        // Fetch and analyze FAQ pages so we do not award credit for links without content
        const faqPagesToInspect = Array.from(faqCandidates).slice(0, 3);
        for (const faqUrl of faqPagesToInspect) {
          const faqContent = await fetchPageContent(faqUrl);
          if (!faqContent) {
            faqFindings.push({
              url: faqUrl,
              content_length: 0,
              has_faq_schema: false,
              has_question_schema: false,
              question_like_blocks: 0,
              adequacy: 'missing',
              summary: 'FAQ page could not be fetched or is empty.',
            });
            continue;
          }

          const { finding } = analyzeFaqContent(faqContent);
          faqFindings.push({
            ...finding,
            url: faqUrl,
            summary: `${finding.summary} | Preview: ${faqContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280)}${faqContent.length > 280 ? '...' : ''}`,
          });
        }

      } else {
        fetchError = `HTTP ${response.status}`;
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Failed to fetch';
    }

    if (faqLinkFound && faqFindings.length === 0) {
      faqFindings.push({
        url: 'faq-link-detected',
        content_length: 0,
        has_faq_schema: false,
        has_question_schema: false,
        question_like_blocks: 0,
        adequacy: 'weak',
        summary: 'FAQ link detected but content could not be fetched or confirmed.',
      });
    }

    const faqCandidateSeen = faqFindings.length > 0 || faqLinkFound;
    const faqAdequacy = faqCandidateSeen
      ? (faqFindings.some(f => f.adequacy === 'strong') ? 'strong' : 'weak')
      : 'missing';

    const qaReadinessCeiling = faqAdequacy === 'strong' ? 100 : faqAdequacy === 'weak' ? 75 : 60;
    const faqSummaryForPrompt = faqFindings.length > 0
      ? faqFindings.map(f => `- ${f.url} • ${f.adequacy.toUpperCase()} • ${f.summary}`).join('\n')
      : '- No FAQ page content was confirmed. A link alone is insufficient for credit.';

    let analysisJson: AnalysisJson | null = null;
    let overallScore = 0;
    let status = 'failed';

    if (!fetchError && htmlContent && openaiApiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an AI visibility optimization expert. Analyze websites for how well AI language models (ChatGPT, Claude, Gemini) can interpret and cite their content.

Evaluate these categories (0-100 each):

1. content_clarity: Clear, factual writing with short paragraphs and scannable structure
2. semantic_structure: Proper HTML5 semantic tags, heading hierarchy (H1>H2>H3), logical document outline
3. schema_metadata: Schema.org markup, Open Graph tags, meta descriptions
4. qa_readiness: FAQ sections, Q&A formatting, definition lists, explicit questions with answers.
5. authority_trust: Author credentials, publication dates, source citations, expertise signals.
6. technical_accessibility: Fast loading, mobile-friendly, clean HTML, no JavaScript barriers.

CRITICAL INSTRUCTIONS FOR FAQ + CSR:
- Never give a high QA Readiness score just because a link to /faq exists. The FAQ content must be visible and substantial.
- Use the provided FAQ findings. If FAQ adequacy is "missing", cap qa_readiness at 60. If "weak", cap at 75. Only go higher when FAQ content is strong and visible.
- If "Is CSR Shell" is TRUE: content is invisible to simple crawlers. Do NOT hallucinate. Give lower Content Clarity/Semantic scores. For QA Readiness, acknowledge any detected FAQ URL but mark content unverified and stay neutral (50-60). Always add high-severity recommendation id "rec-csr-fix" in technical_accessibility with the provided wording about implementing SSR/prerendering. Suppress "Add FAQ Section" if an FAQ URL exists; instead recommend verifying FAQ visibility.

EXPLANATIONS ARE MANDATORY:
- Every category must include a "score_reason" and a "improvement_path" describing why the score is not 100 and what to do to reach 100. Even scores 90+ need a brief reason for not being perfect.
- Provide at least one recommendation for every category below 100. All recommendations must map to the relevant category.
- If overall score is not 100, include in notes why it is high but not perfect.

Provide 3-5 actionable recommendations prioritized by impact.

Return ONLY valid JSON matching this exact structure:
{
  "overall_score": 75,
  "category_scores": {
    "content_clarity": 80,
    "semantic_structure": 70,
    "schema_metadata": 60,
    "qa_readiness": 75,
    "authority_trust": 85,
    "technical_accessibility": 90
  },
  "category_feedback": {
    "content_clarity": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" },
    "semantic_structure": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" },
    "schema_metadata": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" },
    "qa_readiness": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" },
    "authority_trust": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" },
    "technical_accessibility": { "score_reason": "Why this is the score", "improvement_path": "What to do to reach 100" }
  },
  "recommendations": [
    {
      "id": "rec-1",
      "category": "semantic_structure",
      "severity": "high",
      "title": "Brief title",
      "description": "Detailed explanation",
      "suggested_fix": "Concrete implementation steps",
      "implementation_effort": "low"
    }
  ],
  "notes": ["Positive observations"],
  "warnings": ["Critical issues"]
}`,
              },
              {
                role: 'user',
                content: `Analyze this website HTML for AI visibility:

URL: ${site.url}

**Detected Site Structure:**
- Is CSR Shell: ${isCsrShell ? 'YES (Content likely invisible to simple crawlers)' : 'NO'}
- Detected Pages: ${detectedPages.length > 0 ? detectedPages.join(', ') : 'None detected'}
- Detected System Files: ${detectedFiles.length > 0 ? detectedFiles.join(', ') : 'None detected'}
**FAQ Findings (must validate content quality before scoring QA Readiness):**
${faqSummaryForPrompt}
- QA Readiness score ceiling based on FAQ adequacy: ${qaReadinessCeiling}

HTML Content (Truncated):
${htmlContent}`,
              },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const content = openaiData.choices[0]?.message?.content;

          if (content) {
            const parsedAnalysis = JSON.parse(content);
            analysisJson = {
              ...parsedAnalysis,
              analyzed_at: new Date().toISOString(),
              analysis_version: '1.4',
              category_feedback: ensureCategoryFeedback(parsedAnalysis.category_scores, parsedAnalysis.category_feedback),
              faq_findings: faqFindings,
            };

            analysisJson.recommendations = sanitizeFaqRecommendations(
              analysisJson.recommendations,
              faqAdequacy,
              isCsrShell
            );

            if (analysisJson.category_scores.qa_readiness > qaReadinessCeiling) {
              analysisJson.category_scores.qa_readiness = qaReadinessCeiling;
              analysisJson.notes = [
                ...(analysisJson.notes || []),
                `QA Readiness capped at ${qaReadinessCeiling} because FAQ content adequacy is "${faqAdequacy}".`,
              ];
              if (analysisJson.category_feedback?.qa_readiness) {
                analysisJson.category_feedback.qa_readiness.score_reason = `Capped at ${qaReadinessCeiling} due to detected FAQ adequacy (${faqAdequacy}).`;
                analysisJson.category_feedback.qa_readiness.improvement_path = 'Add a well-structured FAQ page with multiple clear Q&A pairs and schema markup to unlock full credit.';
              }
            }

            const recomputedOverall = Math.round(
              Object.values(analysisJson.category_scores).reduce((sum, val) => sum + val, 0) / categoryKeys.length
            );
            analysisJson.overall_score = Math.min(analysisJson.overall_score, recomputedOverall);
            overallScore = analysisJson.overall_score;
            status = 'completed';
          }
        } else {
          console.error('OpenAI API error:', await openaiResponse.text());
          throw new Error('OpenAI analysis failed');
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        status = 'failed';
      }
    } else if (!fetchError && htmlContent) {
      // Fallback logic
      const hasH1 = /<h1[^>]*>/.test(htmlContent);
      const hasHeadings = /<h[2-6][^>]*>/.test(htmlContent);
      const hasSemanticTags = /<(article|section|nav|aside|header|footer)[^>]*>/.test(htmlContent);
      const hasMeta = /<meta[^>]*>/.test(htmlContent);
      const contentLength = htmlContent.length;

      const hasFaq = faqAdequacy !== 'missing';
      const hasRobots = detectedFiles.includes('robots.txt');

      let score = 50;
      if (hasH1) score += 10;
      if (hasHeadings) score += 10;
      if (hasSemanticTags) score += 15;
      if (hasMeta) score += 10;
      if (contentLength > 5000) score += 5;
      if (hasFaq) score += 10;
      if (isCsrShell) score -= 20; // Penalty for CSR shell

      overallScore = Math.max(0, Math.min(score, 100));

      const qaScoreBase = hasFaq ? (faqAdequacy === 'strong' ? 70 : 55) : 40;
      const qaScore = Math.min(qaReadinessCeiling, qaScoreBase);

      const categoryScores: CategoryScores = {
        content_clarity: hasH1 ? 70 : (isCsrShell ? 30 : 50),
        semantic_structure: hasSemanticTags ? 75 : 40,
        schema_metadata: hasMeta ? 60 : 30,
        qa_readiness: qaScore,
        authority_trust: 50,
        technical_accessibility: hasRobots ? 85 : 60,
      };

      const categoryFeedback: Record<CategoryKey, CategoryFeedback> = {
        content_clarity: {
          score_reason: hasH1
            ? 'Found an H1 and readable copy, but clarity and brevity can improve.'
            : isCsrShell
            ? 'Content appears hidden behind client-side rendering; crawlers cannot see it.'
            : 'No clear H1 detected; content clarity signals are limited.',
          improvement_path: 'Add a concise H1 and intro, keep paragraphs short, and ensure key copy renders without JavaScript.',
        },
        semantic_structure: {
          score_reason: hasSemanticTags
            ? 'Semantic tags present but heading hierarchy may be uneven.'
            : 'Semantic landmarks (section/article/nav/footer) are sparse.',
          improvement_path: 'Use a single H1, nested H2/H3 headings, and wrap content in semantic HTML5 sections.',
        },
        schema_metadata: {
          score_reason: hasMeta
            ? 'Meta tags exist but structured data coverage is unclear.'
            : 'Missing or minimal meta tags and schema markup.',
          improvement_path: 'Add meta description, Open Graph tags, and schema.org markup for your content type.',
        },
        qa_readiness: {
          score_reason: hasFaq
            ? `FAQ detected with ${faqAdequacy} quality; capped at ${qaScore}.`
            : 'No visible FAQ content detected; only generic content available.',
          improvement_path: 'Publish a visible FAQ page with multiple Q&A pairs and FAQPage schema to unlock full credit.',
        },
        authority_trust: {
          score_reason: 'Limited visible author credentials, dates, or citations detected.',
          improvement_path: 'Show author names, publish dates, and cite reputable sources to build trust.',
        },
        technical_accessibility: {
          score_reason: hasRobots
            ? 'robots.txt reachable; further performance/mobile signals unverified.'
            : 'No clear crawl directives detected; technical signals partially observed.',
          improvement_path: 'Keep pages fast, mobile-friendly, and ensure crawl directives are explicit in robots.txt and sitemaps.',
        },
      };

      const recommendations: Recommendation[] = [
        {
          id: 'rec-basic',
          category: 'semantic_structure',
          severity: 'medium',
          title: 'Basic analysis performed',
          description: 'OpenAI integration not configured. This is a basic structural analysis.',
          suggested_fix: 'Configure OpenAI API key for detailed AI visibility analysis.',
          implementation_effort: 'low',
        },
      ];

      if (isCsrShell) {
        recommendations.unshift({
          id: 'rec-csr-fix',
          category: 'technical_accessibility',
          severity: 'high',
          title: 'Implement Server-Side Rendering (SSR)',
          description: 'Your website uses Client-Side Rendering, making your content invisible to many AI models that do not execute JavaScript. This severely limits your AI visibility.',
          suggested_fix: 'Migrate to a framework that supports SSR (like Next.js) or implement Prerendering for your current stack.',
          implementation_effort: 'high',
        });
      }

      analysisJson = {
        overall_score: overallScore,
        category_scores: categoryScores,
        category_feedback: categoryFeedback,
        recommendations: sanitizeFaqRecommendations(recommendations, faqAdequacy, isCsrShell),
        notes: [
          'Basic HTML structure analysis completed without AI model enrichment.',
          ...(qaScore < 100 ? [`QA Readiness capped at ${qaScore} because FAQ adequacy is "${faqAdequacy}".`] : []),
        ],
        warnings: isCsrShell ? ['Client-Side Rendering detected. Content may be invisible to AI crawlers.'] : [],
        faq_findings: faqFindings,
        analyzed_at: new Date().toISOString(),
        analysis_version: '1.4',
      };
      const recomputedOverall = Math.round(
        Object.values(analysisJson.category_scores).reduce((sum, val) => sum + val, 0) / categoryKeys.length
      );
      analysisJson.overall_score = Math.min(analysisJson.overall_score, recomputedOverall);
      overallScore = analysisJson.overall_score;
      status = 'completed';
    }

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status,
        overall_score: status === 'completed' ? overallScore : null,
        analysis_json: status === 'completed' ? analysisJson : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', newScan.id);

    if (updateError) {
      console.error('Failed to update scan:', updateError);
    }

    if (status === 'completed') {
      await supabase
        .from('sites')
        .update({ last_scanned_at: new Date().toISOString() })
        .eq('id', siteId);
    }

    const { data: updatedScan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', newScan.id)
      .single();

    return new Response(
      JSON.stringify(updatedScan || newScan),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
