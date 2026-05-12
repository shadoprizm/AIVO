import {
  CategoryInference,
  CompetitorBreakdown,
  ContentFormat,
  ContentGap,
  ContentIntent,
  DiscoveredSite,
} from './analysis-types.ts';
import { callDeepSeekJson } from './deepseek-client.ts';

interface ContentGapsResponse {
  content_gaps?: Array<Partial<ContentGap>>;
}

function isValidIntent(v: unknown): v is ContentIntent {
  return v === 'informational' || v === 'commercial' || v === 'transactional' || v === 'comparison';
}

function isValidFormat(v: unknown): v is ContentFormat {
  return v === 'faq' || v === 'comparison_table' || v === 'how_to' || v === 'definition' || v === 'listicle';
}

export async function findContentGaps(
  site: DiscoveredSite,
  category: CategoryInference | undefined,
  competitorTeardown: CompetitorBreakdown[],
  options: { timeoutMs: number } = { timeoutMs: 20_000 },
): Promise<ContentGap[]> {
  const response = await callDeepSeekJson<ContentGapsResponse>(
    [
      {
        role: 'system',
        content: 'You find content gaps for a GEO audit. Generate 20-30 canonical questions a knowledgeable user would ask an AI engine about the target\'s space. For each: determine whether the target\'s site appears to address it (based on detected URLs and content excerpts), and whether competitors appear to address it (based on FAQ topics). Be specific to the category, not generic. Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          target: {
            domain: site.domain,
            category: category?.category ?? null,
            primary_use_cases: category?.primary_use_cases ?? [],
            existing_pages: site.evidence.discovered_pages.slice(0, 60),
            detected_pages: site.detected_pages,
            site_excerpts: site.pages.slice(0, 3).map((p) => ({
              url: p.url,
              excerpt: p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800),
            })),
          },
          competitor_faq_topics: competitorTeardown.flatMap((c) => c.faq_topics).slice(0, 50),
          competitor_entities: competitorTeardown.flatMap((c) => c.entities_owned).slice(0, 50),
          required_shape: {
            content_gaps: [
              {
                question: 'string (the canonical question phrasing)',
                intent: 'informational | commercial | transactional | comparison',
                has_answer: 'boolean (does the target site appear to address this question?)',
                competitor_has_answer: 'boolean (do detected competitor FAQ topics cover this?)',
                suggested_format: 'faq | comparison_table | how_to | definition | listicle',
                rationale: 'one sentence on why this question matters and which signal informed the judgment',
              },
            ],
          },
        }),
      },
    ],
    { timeoutMs: options.timeoutMs, maxTokens: 4000 },
  );

  if (!response?.content_gaps) return [];
  return response.content_gaps
    .filter((g): g is Partial<ContentGap> & { question: string } =>
      Boolean(g && typeof g.question === 'string' && g.question.length > 0))
    .map((g): ContentGap => ({
      question: g.question.slice(0, 220),
      intent: isValidIntent(g.intent) ? g.intent : 'informational',
      has_answer: Boolean(g.has_answer),
      competitor_has_answer: Boolean(g.competitor_has_answer),
      suggested_format: isValidFormat(g.suggested_format) ? g.suggested_format : 'faq',
      rationale: typeof g.rationale === 'string' ? g.rationale.slice(0, 300) : '',
    }))
    .slice(0, 30);
}
