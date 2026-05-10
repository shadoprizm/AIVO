import { AnswerTest, DiscoveredSite } from './analysis-types.ts';

interface DeepSeekChoice {
  message?: {
    content?: string;
  };
}

interface AnswerSimulationResponse {
  tests?: AnswerTest[];
}

function getModel(): string {
  return Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
}

function getApiUrl(): string {
  const baseUrl = (Deno.env.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com/v1').replace(/\/$/, '');
  return `${baseUrl}/chat/completions`;
}

function getApiKey(): string | null {
  return Deno.env.get('DEEPSEEK_API_KEY') ?? null;
}

function isAnswerTest(value: unknown): value is AnswerTest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerTest>;
  return (
    typeof candidate.prompt === 'string' &&
    typeof candidate.model === 'string' &&
    typeof candidate.brand_mentioned === 'boolean' &&
    Array.isArray(candidate.competitors_mentioned) &&
    Array.isArray(candidate.cited_urls) &&
    typeof candidate.confidence === 'number' &&
    Array.isArray(candidate.missing_evidence) &&
    typeof candidate.raw_excerpt === 'string'
  );
}

export function generateAnswerSimulationPrompts(site: DiscoveredSite): string[] {
  const brand = site.domain.replace(/^www\./, '');
  return [
    `What does ${brand} do?`,
    `Is ${brand} trustworthy?`,
  ].slice(0, 2);
}

export async function runAnswerSimulations(site: DiscoveredSite, timeoutMs = 20_000): Promise<AnswerTest[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const prompts = generateAnswerSimulationPrompts(site);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: 'You run capped AI Answer Simulation tests for a GEO audit. Never claim this checks ChatGPT or any other external engine. Return strict JSON only.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              label: 'AI Answer Simulation',
              prompts,
              site: {
                domain: site.domain,
                discovered_pages: site.evidence.discovered_pages,
                fetched_pages: site.pages.map((page) => ({
                  url: page.url,
                  excerpt: page.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200),
                })),
                system_files: site.system_files.map((file) => ({
                  type: file.type,
                  excerpt: file.content.slice(0, 1200),
                })),
              },
              required_shape: {
                tests: [
                  {
                    prompt: 'string',
                    model: getModel(),
                    brand_mentioned: 'boolean',
                    competitors_mentioned: 'string[]',
                    cited_urls: 'string[]',
                    sentiment: 'positive | neutral | negative | unknown',
                    confidence: 'number between 0 and 1',
                    missing_evidence: 'string[]',
                    raw_excerpt: 'string',
                  },
                ],
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const payload = await response.json() as { choices?: DeepSeekChoice[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as AnswerSimulationResponse;
    return (parsed.tests ?? [])
      .filter(isAnswerTest)
      .slice(0, 2)
      .map((test) => ({
        ...test,
        model: getModel(),
        raw_excerpt: test.raw_excerpt.slice(0, 500),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
