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
- Return strict JSON. No markdown. No explanations outside JSON.`;

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
        instruction: 'Analyze this crawl and return JSON with scores, summary, and evidence-backed recommendations.',
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
        max_tokens: 4000,
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
      };
    } catch {
      return null;
    }
  }

  return null;
}
