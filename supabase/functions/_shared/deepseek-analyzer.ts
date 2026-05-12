import { ScanAnalysis, ScanInput, TechnicalScores } from './analysis-types.ts';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface DeepSeekChoice {
  message?: {
    content?: string;
  };
}

interface DeepSeekResponse {
  choices?: DeepSeekChoice[];
}

const SYSTEM_PROMPT = `You are a GEO technical auditor. Base every recommendation on evidence from the provided crawl data.

Rules:
- If FAQ schema is detected, NEVER recommend adding FAQ
- If schema.org is present, name specific missing types
- Every recommendation must include title severity evidence why_it_matters exact_fix effort_estimate owner expected_impact
- Return strict JSON. No markdown. No explanations outside JSON.

You must also produce four additional fields alongside the recommendations: category_inference, ai_fix_prompt_markdown, ai_fix_prompt_structured, and customer_summary.

category_inference rules:
- Infer the target's product category in 2-5 words (e.g. "free website security scanner", "team chat platform", "AI visibility audit tool")
- category_aliases: 2-4 alternate phrasings real users would search for
- brand: the canonical brand name (not the domain). If the brand is unclear, fall back to the domain without TLD.
- primary_use_cases: 2-4 short imperative phrases describing what a user comes here to do (e.g. "scan my site for vulnerabilities", "monitor competitor mentions")
- This inference seeds downstream competitor discovery and query simulation, so be specific and accurate.

ai_fix_prompt_markdown rules:
- A complete, ready-to-paste prompt for an AI coding agent (Claude Code, Cursor, GitHub Copilot)
- Starts with a short context block: site URL, overall score, scan date
- Lists every recommendation in priority order (high severity first) as numbered sections with: evidence, exact_fix, files or locations to edit, and a verification step
- Ends with a single closing instruction asking the agent to re-run the AIVO scan and confirm the overall score has improved
- Plain markdown, no HTML, no surrounding code fences

ai_fix_prompt_structured rules:
- Same content as ai_fix_prompt_markdown but as structured JSON for programmatic consumption
- issues array entries: priority (1-based), severity, title, files_or_locations (string array of file paths or page locations like "<head> of /faq"), exact_change (a copy of exact_fix expressed as a code or content edit), verification (one-line check the agent can run after applying the change)

customer_summary rules:
- Written for a non-technical small business owner. NO jargon.
- Forbidden words: schema, JSON-LD, canonical, robots.txt, sitemap, meta tag, h1, hreflang, llms.txt, structured markup
- Allowed replacements: "structured data" (for schema/JSON-LD), "preferred page version" (for canonical), "crawler instructions" (for robots.txt), "search index map" (for sitemap), "page description" (for meta description)
- headline: one sentence describing where the site stands overall
- score_interpretation: one or two sentences explaining what the overall score means in business terms
- issues: one entry per recommendation in the same order (recommendation_index is the 0-based index into the recommendations array). business_impact must answer "how does this cost me customers". what_we_recommend must be a plain-language description of the fix.
- closing_call_to_action: one sentence offering to implement the fixes`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function isScanAnalysis(value: unknown): value is ScanAnalysis {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ScanAnalysis>;
  return (
    typeof candidate.summary === 'string' &&
    Boolean(candidate.scores) &&
    Array.isArray(candidate.recommendations)
  );
}

function mergeScores(technicalScores: TechnicalScores, llmScores: Partial<TechnicalScores> | undefined): TechnicalScores {
  const nextScores = {
    ...technicalScores,
    ...llmScores,
  };

  return {
    ...nextScores,
    overall: Math.round(
      nextScores.crawl_access * 0.25 +
      nextScores.entity_clarity * 0.20 +
      nextScores.answer_readiness * 0.20 +
      nextScores.citation_likelihood * 0.15 +
      nextScores.trust_evidence * 0.15 +
      nextScores.competitive_presence * 0.05
    ),
  };
}

function buildMessages(scanData: ScanInput): ChatMessage[] {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: JSON.stringify({
        instruction: 'Analyze this crawl and return JSON with scores, summary, category_inference, evidence-backed recommendations, an AI agent fix prompt (markdown + structured), and a plain-language customer summary.',
        required_shape: {
          scores: {
            crawl_access: 'number',
            entity_clarity: 'number',
            answer_readiness: 'number',
            citation_likelihood: 'number',
            trust_evidence: 'number',
            competitive_presence: 'number',
            overall: 'number',
          },
          summary: 'string',
          category_inference: {
            category: 'string (2-5 words)',
            category_aliases: 'string[] (2-4 phrasings)',
            brand: 'string (canonical brand name)',
            primary_use_cases: 'string[] (2-4 imperative phrases)',
          },
          recommendations: [
            {
              title: 'string',
              severity: 'high | medium | low',
              evidence: 'string',
              why_it_matters: 'string',
              exact_fix: 'string',
              effort_estimate: 'low | medium | high',
              owner: 'developer | content | marketing | owner',
              expected_impact: 'string',
            },
          ],
          ai_fix_prompt_markdown: 'string (complete markdown prompt for an AI coding agent)',
          ai_fix_prompt_structured: {
            site_url: 'string',
            overall_score: 'number',
            scan_date: 'string (ISO date)',
            issues: [
              {
                priority: 'number (1-based)',
                severity: 'high | medium | low',
                title: 'string',
                files_or_locations: ['string'],
                exact_change: 'string',
                verification: 'string',
              },
            ],
            post_fix_action: 'string',
          },
          customer_summary: {
            headline: 'string',
            score_interpretation: 'string',
            issues: [
              {
                recommendation_index: 'number (0-based index into recommendations)',
                title: 'string (plain-language, no jargon)',
                business_impact: 'string (plain-language, no jargon)',
                what_we_recommend: 'string (plain-language, no jargon)',
              },
            ],
            closing_call_to_action: 'string',
          },
        },
        crawl_data: scanData.site,
        technical_checks: scanData.technical,
      }),
    },
  ];
}

async function postDeepSeek(messages: ChatMessage[], timeoutMs: number): Promise<Response> {
  const apiKey = getRequiredEnv('DEEPSEEK_API_KEY');
  const baseUrl = (Deno.env.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com/v1').replace(/\/$/, '');
  const model = Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 8000,
      }),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getDeepSeekTimeoutMs(audience: 'anonymous' | 'authenticated'): number {
  return audience === 'anonymous' ? 25_000 : 45_000;
}

export async function analyzeWithDeepSeek(scanData: ScanInput, timeoutMs: number): Promise<ScanAnalysis | null> {
  const messages = buildMessages(scanData);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await postDeepSeek(messages, timeoutMs);
      if ((response.status === 429 || response.status === 503) && attempt === 0) {
        await delay(500);
        continue;
      }

      if (!response.ok) return null;

      const payload = await response.json() as DeepSeekResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as unknown;
      if (!isScanAnalysis(parsed)) return null;

      return {
        ...parsed,
        scores: mergeScores(scanData.technical.scores, parsed.scores),
        recommendations: (parsed.recommendations ?? []).map((rec) => ({
          ...rec,
          source: rec.source ?? 'technical',
        })),
      };
    } catch {
      return null;
    }
  }

  return null;
}
