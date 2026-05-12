import {
  AnswerTest,
  CategoryInference,
  CitationFormat,
  CompetitorCandidate,
  DiscoveredSite,
  GenerativeAudit,
  QueryBatteryItem,
  QueryIntent,
} from './analysis-types.ts';
import { callDeepSeekJson, deepseekModel } from './deepseek-client.ts';

interface QueryItemResponse extends Partial<AnswerTest> {
  intent?: QueryIntent;
  citation_format?: CitationFormat;
}

interface BatteryResponse {
  results?: QueryItemResponse[];
}

function brandLabel(site: DiscoveredSite, category: CategoryInference | undefined): string {
  return (category?.brand ?? '').trim() || site.domain.replace(/^www\./, '');
}

export function buildQueryBattery(
  site: DiscoveredSite,
  category: CategoryInference | undefined,
  competitors: CompetitorCandidate[],
): Array<{ prompt: string; intent: QueryIntent }> {
  const brand = brandLabel(site, category);
  const categoryLabel = category?.category ?? '';
  const useCases = category?.primary_use_cases ?? [];
  const topCompetitors = competitors.slice(0, 3);

  const battery: Array<{ prompt: string; intent: QueryIntent }> = [
    { prompt: `What does ${brand} do?`, intent: 'brand' },
    { prompt: `Is ${brand} trustworthy?`, intent: 'brand' },
  ];

  if (categoryLabel) {
    battery.push({ prompt: `What is the best ${categoryLabel}?`, intent: 'category' });
    battery.push({ prompt: `What are the top ${categoryLabel} tools in 2026?`, intent: 'category' });
    battery.push({ prompt: `Is there a free ${categoryLabel}?`, intent: 'category' });
  }

  for (const useCase of useCases.slice(0, 2)) {
    battery.push({ prompt: `How do I ${useCase}?`, intent: 'intent' });
  }

  for (const competitor of topCompetitors) {
    battery.push({ prompt: `${brand} vs ${competitor.name}`, intent: 'comparison' });
  }

  return battery.slice(0, 12);
}

function clampUnit(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function isValidIntent(value: unknown): value is QueryIntent {
  return value === 'brand' || value === 'category' || value === 'comparison' || value === 'intent' || value === 'feature';
}

function isValidCitationFormat(value: unknown): value is CitationFormat {
  return value === 'quoted' || value === 'listed' || value === 'linked' || value === 'named' || value === 'absent';
}

function isValidSentiment(value: unknown): value is AnswerTest['sentiment'] {
  return value === 'positive' || value === 'neutral' || value === 'negative' || value === 'unknown';
}

export async function runQueryBattery(
  site: DiscoveredSite,
  category: CategoryInference | undefined,
  competitors: CompetitorCandidate[],
  options: { timeoutMs: number } = { timeoutMs: 25_000 },
): Promise<QueryBatteryItem[]> {
  const battery = buildQueryBattery(site, category, competitors);
  if (!battery.length) return [];

  const response = await callDeepSeekJson<BatteryResponse>(
    [
      {
        role: 'system',
        content: 'You run an AI Answer Simulation battery for a GEO audit. For each prompt, simulate how a knowledgeable AI assistant would answer using prior public training data and only the provided context. Never claim this checks ChatGPT, Claude, Gemini, or any external engine in real time. If the brand is not well known to you, mark brand_mentioned=false and explain in missing_evidence. Be calibrated: do not invent citations. Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          label: 'AI Answer Simulation Battery',
          target: {
            brand: brandLabel(site, category),
            domain: site.domain,
            category: category?.category ?? null,
          },
          competitors: competitors.slice(0, 5).map((c) => ({ name: c.name, url: c.url })),
          fetched_pages: site.pages.map((page) => ({
            url: page.url,
            excerpt: page.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800),
          })),
          system_files: site.system_files.map((file) => ({ type: file.type, excerpt: file.content.slice(0, 600) })),
          prompts: battery,
          required_shape: {
            results: [
              {
                prompt: 'string (echo the input prompt exactly)',
                intent: 'brand | category | comparison | intent | feature',
                model: deepseekModel(),
                brand_mentioned: 'boolean',
                competitors_mentioned: 'string[]',
                cited_urls: 'string[]',
                sentiment: 'positive | neutral | negative | unknown',
                confidence: 'number between 0 and 1',
                missing_evidence: 'string[]',
                citation_format: 'quoted | listed | linked | named | absent',
                raw_excerpt: 'string under 400 chars',
              },
            ],
          },
        }),
      },
    ],
    { timeoutMs: options.timeoutMs, maxTokens: 4000 },
  );

  const raw = response?.results ?? [];
  const promptToIntent = new Map(battery.map((b) => [b.prompt, b.intent] as const));

  return raw
    .filter((entry): entry is QueryItemResponse & { prompt: string } =>
      Boolean(entry && typeof entry.prompt === 'string'))
    .map((entry): QueryBatteryItem => ({
      prompt: entry.prompt,
      model: deepseekModel(),
      brand_mentioned: Boolean(entry.brand_mentioned),
      competitors_mentioned: Array.isArray(entry.competitors_mentioned)
        ? entry.competitors_mentioned.map(String).slice(0, 10)
        : [],
      cited_urls: Array.isArray(entry.cited_urls) ? entry.cited_urls.map(String).slice(0, 10) : [],
      sentiment: isValidSentiment(entry.sentiment) ? entry.sentiment : 'unknown',
      confidence: clampUnit(entry.confidence),
      missing_evidence: Array.isArray(entry.missing_evidence)
        ? entry.missing_evidence.map(String).slice(0, 6)
        : [],
      raw_excerpt: typeof entry.raw_excerpt === 'string' ? entry.raw_excerpt.slice(0, 400) : '',
      intent: isValidIntent(entry.intent) ? entry.intent : (promptToIntent.get(entry.prompt) ?? 'brand'),
      citation_format: isValidCitationFormat(entry.citation_format) ? entry.citation_format : 'absent',
    }))
    .slice(0, battery.length);
}

export function summarizeGenerativeAudit(battery: QueryBatteryItem[]): GenerativeAudit {
  if (!battery.length) {
    return {
      query_battery: [],
      brand_mention_rate: 0,
      competitor_mention_rate: 0,
      citation_rate: 0,
      notes: 'No query battery results available.',
    };
  }
  const total = battery.length;
  const mentionCount = battery.filter((b) => b.brand_mentioned).length;
  const competitorMentionCount = battery.filter((b) => b.competitors_mentioned.length > 0).length;
  const citedCount = battery.filter((b) => b.citation_format === 'quoted' || b.citation_format === 'linked').length;
  const mentionRate = mentionCount / total;
  return {
    query_battery: battery,
    brand_mention_rate: mentionRate,
    competitor_mention_rate: competitorMentionCount / total,
    citation_rate: citedCount / total,
    notes: mentionCount === 0
      ? 'Brand was not mentioned in any simulated response. Strong indicator of low generative visibility.'
      : `Brand mentioned in ${mentionCount} of ${total} queries (${Math.round(mentionRate * 100)}%).`,
  };
}

