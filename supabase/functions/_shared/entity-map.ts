import {
  CategoryInference,
  CompetitorBreakdown,
  DiscoveredSite,
  EntityMap,
  QueryBatteryItem,
} from './analysis-types.ts';
import { callDeepSeekJson } from './deepseek-client.ts';

type EntityMapResponse = Partial<EntityMap>;

export async function buildEntityMap(
  site: DiscoveredSite,
  category: CategoryInference | undefined,
  battery: QueryBatteryItem[],
  competitorTeardown: CompetitorBreakdown[],
  options: { timeoutMs: number } = { timeoutMs: 20_000 },
): Promise<EntityMap | null> {
  const response = await callDeepSeekJson<EntityMapResponse>(
    [
      {
        role: 'system',
        content: 'You build an entity salience map for a GEO audit. Compare what the target site CLAIMS (its own copy) vs what AI engines actually associate with the brand (from query battery results) vs what competitors own. Be specific. Avoid generic terms. Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          target: {
            domain: site.domain,
            brand: category?.brand ?? site.domain,
            category: category?.category ?? null,
            primary_use_cases: category?.primary_use_cases ?? [],
            site_excerpts: site.pages.slice(0, 3).map((p) => ({
              url: p.url,
              excerpt: p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200),
            })),
            system_files: site.system_files.map((f) => ({ type: f.type, excerpt: f.content.slice(0, 600) })),
          },
          query_battery: battery.map((b) => ({
            prompt: b.prompt,
            brand_mentioned: b.brand_mentioned,
            competitors_mentioned: b.competitors_mentioned,
            missing_evidence: b.missing_evidence,
            raw_excerpt: b.raw_excerpt,
          })),
          competitor_teardown: competitorTeardown.map((c) => ({
            name: c.name,
            entities_owned: c.entities_owned,
          })),
          required_shape: {
            claimed: 'string[] (10-15 specific entities the target claims via its own content)',
            perceived: 'string[] (entities AI engines actually associate with the brand based on query battery)',
            gaps: 'string[] (claimed entities that did not surface in query battery)',
            competitor_owned: 'string[] (entities competitors own that the target does not claim)',
            salience_score: 'number 0-100 (how clearly defined the target identity is)',
            notes: 'string (one short paragraph explaining the salience score)',
          },
        }),
      },
    ],
    { timeoutMs: options.timeoutMs, maxTokens: 2000 },
  );

  if (!response) return null;
  return {
    claimed: Array.isArray(response.claimed) ? response.claimed.slice(0, 20).map(String) : [],
    perceived: Array.isArray(response.perceived) ? response.perceived.slice(0, 20).map(String) : [],
    gaps: Array.isArray(response.gaps) ? response.gaps.slice(0, 20).map(String) : [],
    competitor_owned: Array.isArray(response.competitor_owned) ? response.competitor_owned.slice(0, 20).map(String) : [],
    salience_score: typeof response.salience_score === 'number'
      ? Math.max(0, Math.min(100, Math.round(response.salience_score)))
      : 0,
    notes: typeof response.notes === 'string' ? response.notes.slice(0, 800) : '',
  };
}
