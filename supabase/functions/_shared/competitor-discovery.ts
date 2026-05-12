import { CategoryInference, CompetitorCandidate, DiscoveredSite } from './analysis-types.ts';
import { callDeepSeekJson } from './deepseek-client.ts';
import { isValidUrl, normalizeUrl } from './url.ts';

interface DiscoveryResponse {
  competitors?: Array<{
    name?: string;
    url?: string;
    confidence?: number;
    reason?: string;
  }>;
}

export async function discoverCompetitors(
  site: DiscoveredSite,
  category: CategoryInference | undefined,
  options: { timeoutMs: number; max?: number } = { timeoutMs: 15_000 },
): Promise<CompetitorCandidate[]> {
  if (!category) return [];

  const max = options.max ?? 6;
  const targetDomain = site.domain.replace(/^www\./, '').toLowerCase();

  const response = await callDeepSeekJson<DiscoveryResponse>(
    [
      {
        role: 'system',
        content: 'You nominate likely direct competitors for a GEO audit. Use the provided category and entity terms. Only nominate companies you have real knowledge of. Skip the target itself. Prefer companies with active public websites at the time of your training data. Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'Nominate likely direct competitors',
          target: {
            domain: site.domain,
            normalized_url: site.normalized_url,
            primary_use_cases: category.primary_use_cases,
          },
          category: {
            label: category.category,
            aliases: category.category_aliases,
          },
          rules: [
            'Skip the target itself',
            'Prefer companies whose primary product overlaps with the target',
            `Return up to ${max} competitors`,
            'Use real, public HTTPS website URLs (omit any URL you are unsure of)',
            'confidence is 0 to 1; reason is one sentence on why this is a competitor',
          ],
          required_shape: {
            competitors: [
              {
                name: 'string',
                url: 'string (https URL)',
                confidence: 'number between 0 and 1',
                reason: 'one sentence',
              },
            ],
          },
        }),
      },
    ],
    { timeoutMs: options.timeoutMs, maxTokens: 1500 },
  );

  if (!response?.competitors) return [];

  const seen = new Set<string>();
  const candidates: CompetitorCandidate[] = [];

  for (const entry of response.competitors) {
    if (!entry || typeof entry.name !== 'string' || typeof entry.url !== 'string') continue;

    let normalized: string;
    try {
      normalized = normalizeUrl(entry.url.trim());
    } catch {
      continue;
    }
    if (!isValidUrl(normalized)) continue;

    const domain = new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
    if (domain === targetDomain || seen.has(domain)) continue;
    seen.add(domain);

    candidates.push({
      name: entry.name.trim().slice(0, 80),
      url: normalized,
      confidence: typeof entry.confidence === 'number' ? Math.max(0, Math.min(1, entry.confidence)) : 0.5,
      source: 'inferred',
      reason: typeof entry.reason === 'string' ? entry.reason.trim().slice(0, 240) : '',
    });

    if (candidates.length >= max) break;
  }

  return candidates;
}
