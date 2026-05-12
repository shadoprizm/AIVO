import {
  BlueprintItem,
  BlueprintPageType,
  BlueprintSection,
  CategoryInference,
  CompetitorBreakdown,
  ContentGap,
  EntityMap,
} from './analysis-types.ts';
import { callDeepSeekJson } from './deepseek-client.ts';

interface BlueprintResponse {
  blueprint?: Array<Partial<BlueprintItem>>;
}

const VALID_PAGE_TYPES: BlueprintPageType[] = ['vs_competitor', 'glossary', 'how_to', 'faq_expansion', 'use_case'];
const VALID_UPLIFTS: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
const VALID_FORMATS: Array<BlueprintSection['format']> = ['definition', 'comparison_table', 'faq', 'how_to', 'list'];

function normalizeSection(input: unknown): BlueprintSection {
  const section = (input && typeof input === 'object') ? input as Partial<BlueprintSection> : {};
  const format: BlueprintSection['format'] = VALID_FORMATS.includes(section.format as BlueprintSection['format'])
    ? (section.format as BlueprintSection['format'])
    : 'list';
  return {
    heading: typeof section.heading === 'string' ? section.heading.slice(0, 200) : '',
    content_summary: typeof section.content_summary === 'string' ? section.content_summary.slice(0, 400) : '',
    format,
  };
}

export async function buildContentBlueprint(
  entityMap: EntityMap | null,
  contentGaps: ContentGap[],
  competitorTeardown: CompetitorBreakdown[],
  category: CategoryInference | undefined,
  options: { timeoutMs: number } = { timeoutMs: 20_000 },
): Promise<BlueprintItem[]> {
  if (!entityMap && !contentGaps.length) return [];

  const response = await callDeepSeekJson<BlueprintResponse>(
    [
      {
        role: 'system',
        content: 'You design a content blueprint that closes specific entity and content gaps. Each blueprint item must be concrete enough to hand to a writer/developer and must reference which gaps it closes. Favour extraction-friendly formats (definitions, comparison tables, numbered steps, FAQPage schema). Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          category: category?.category ?? null,
          entity_map: entityMap,
          unanswered_questions: contentGaps.filter((g) => !g.has_answer).slice(0, 20),
          competitor_owned_topics: competitorTeardown.flatMap((c) => c.entities_owned).slice(0, 30),
          competitor_names: competitorTeardown.map((c) => c.name).slice(0, 5),
          rules: [
            'Produce 5-8 blueprint items',
            'At least one vs_competitor page if competitors are present',
            'At least one glossary entry for any high-value entity_map gap',
            'Each item must reference closes_gaps (entity names or question phrasings)',
            'suggested_url should be a plausible relative path like /vs/competitor-name',
          ],
          required_shape: {
            blueprint: [
              {
                page_type: 'vs_competitor | glossary | how_to | faq_expansion | use_case',
                suggested_url: 'string (relative path)',
                title: 'string',
                sections: [
                  {
                    heading: 'string',
                    content_summary: 'string',
                    format: 'definition | comparison_table | faq | how_to | list',
                  },
                ],
                target_entities: 'string[]',
                target_queries: 'string[]',
                schema_template: 'string (e.g. FAQPage, DefinedTerm, HowTo, Article)',
                closes_gaps: 'string[]',
                expected_citation_uplift: 'low | medium | high',
              },
            ],
          },
        }),
      },
    ],
    { timeoutMs: options.timeoutMs, maxTokens: 3500 },
  );

  if (!response?.blueprint) return [];

  return response.blueprint
    .filter((b): b is Partial<BlueprintItem> & { title: string; suggested_url: string } =>
      Boolean(b && typeof b.title === 'string' && typeof b.suggested_url === 'string'))
    .map((b): BlueprintItem => ({
      page_type: VALID_PAGE_TYPES.includes(b.page_type as BlueprintPageType)
        ? (b.page_type as BlueprintPageType)
        : 'use_case',
      suggested_url: b.suggested_url.slice(0, 200),
      title: b.title.slice(0, 200),
      sections: Array.isArray(b.sections) ? b.sections.slice(0, 10).map(normalizeSection) : [],
      target_entities: Array.isArray(b.target_entities) ? b.target_entities.slice(0, 10).map(String) : [],
      target_queries: Array.isArray(b.target_queries) ? b.target_queries.slice(0, 10).map(String) : [],
      schema_template: typeof b.schema_template === 'string' ? b.schema_template.slice(0, 100) : 'Article',
      closes_gaps: Array.isArray(b.closes_gaps) ? b.closes_gaps.slice(0, 10).map(String) : [],
      expected_citation_uplift: VALID_UPLIFTS.includes(b.expected_citation_uplift as 'low' | 'medium' | 'high')
        ? (b.expected_citation_uplift as 'low' | 'medium' | 'high')
        : 'medium',
    }))
    .slice(0, 10);
}
