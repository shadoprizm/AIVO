import { CompetitorBreakdown, CompetitorCandidate } from './analysis-types.ts';
import { callDeepSeekJson } from './deepseek-client.ts';
import { fetchWithTimeout } from './fetch.ts';
import { isValidUrl } from './url.ts';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 80_000;

interface TeardownResponse {
  entities_owned?: string[];
  faq_topics?: string[];
  positioning_summary?: string;
  citation_format_signals?: string[];
}

interface CompetitorSnapshot {
  candidate: CompetitorCandidate;
  schema_types: string[];
  title: string;
  meta_description: string;
  h1s: string[];
  body_excerpt: string;
  fetch_status: 'ok' | 'failed';
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>();
  const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    for (const t of match[1].matchAll(/"@type"\s*:\s*"([^"]+)"/gi)) {
      types.add(t[1]);
    }
  }
  return Array.from(types);
}

function extractTitle(html: string): string {
  return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function extractMetaDescription(html: string): string {
  return (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ?? '').slice(0, 400);
}

function extractH1s(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) {
    out.push(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  return out.filter(Boolean).slice(0, 5);
}

function extractBodyText(html: string, max: number): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function emptyBreakdown(candidate: CompetitorCandidate, status: CompetitorBreakdown['fetch_status'], note: string): CompetitorBreakdown {
  return {
    name: candidate.name,
    url: candidate.url,
    entities_owned: [],
    schema_coverage: [],
    faq_topics: [],
    positioning_summary: note,
    citation_format_signals: [],
    fetch_status: status,
  };
}

async function snapshotCompetitor(candidate: CompetitorCandidate): Promise<CompetitorSnapshot> {
  const failed: CompetitorSnapshot = {
    candidate,
    schema_types: [],
    title: '',
    meta_description: '',
    h1s: [],
    body_excerpt: '',
    fetch_status: 'failed',
  };

  if (!isValidUrl(candidate.url)) return failed;

  try {
    const response = await fetchWithTimeout(candidate.url, { method: 'GET' }, FETCH_TIMEOUT_MS, MAX_BYTES);
    if (!response.ok) return failed;
    const html = await response.text();
    return {
      candidate,
      schema_types: extractSchemaTypes(html),
      title: extractTitle(html),
      meta_description: extractMetaDescription(html),
      h1s: extractH1s(html),
      body_excerpt: extractBodyText(html, 4000),
      fetch_status: 'ok',
    };
  } catch {
    return failed;
  }
}

async function analyzeSnapshot(snapshot: CompetitorSnapshot, timeoutMs: number): Promise<CompetitorBreakdown> {
  const { candidate } = snapshot;
  if (snapshot.fetch_status === 'failed') {
    return emptyBreakdown(candidate, 'failed', 'Site could not be fetched.');
  }

  const response = await callDeepSeekJson<TeardownResponse>(
    [
      {
        role: 'system',
        content: 'You analyze a competitor website for a GEO audit. Extract the entities the competitor owns (specific concepts they clearly claim), the FAQ topics they cover, their positioning, and the extraction-friendly content formats present. Avoid generic terms like "quality" or "value". Return strict JSON only.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          competitor: {
            name: candidate.name,
            url: candidate.url,
            title: snapshot.title,
            meta_description: snapshot.meta_description,
            h1s: snapshot.h1s,
            schema_types_detected: snapshot.schema_types,
            homepage_excerpt: snapshot.body_excerpt,
          },
          required_shape: {
            entities_owned: 'string[] (up to 10 specific concepts this competitor claims to own)',
            faq_topics: 'string[] (up to 8 FAQ topics if detected, else empty array)',
            positioning_summary: 'string (one sentence on how they position themselves)',
            citation_format_signals: 'string[] (formats present: definitions, comparison_tables, numbered_steps, faq, statistics, pull_quotes)',
          },
        }),
      },
    ],
    { timeoutMs, maxTokens: 1200 },
  );

  if (!response) {
    return {
      name: candidate.name,
      url: candidate.url,
      entities_owned: [],
      schema_coverage: snapshot.schema_types,
      faq_topics: [],
      positioning_summary: snapshot.meta_description || snapshot.title || 'Analysis unavailable.',
      citation_format_signals: [],
      fetch_status: 'ok',
    };
  }

  return {
    name: candidate.name,
    url: candidate.url,
    entities_owned: Array.isArray(response.entities_owned) ? response.entities_owned.slice(0, 10).map(String) : [],
    schema_coverage: snapshot.schema_types,
    faq_topics: Array.isArray(response.faq_topics) ? response.faq_topics.slice(0, 8).map(String) : [],
    positioning_summary: typeof response.positioning_summary === 'string'
      ? response.positioning_summary.slice(0, 400)
      : (snapshot.meta_description || snapshot.title),
    citation_format_signals: Array.isArray(response.citation_format_signals)
      ? response.citation_format_signals.slice(0, 8).map(String)
      : [],
    fetch_status: 'ok',
  };
}

export async function runCompetitorTeardown(
  candidates: CompetitorCandidate[],
  options: { timeoutMs: number; max?: number } = { timeoutMs: 20_000 },
): Promise<CompetitorBreakdown[]> {
  if (!candidates.length) return [];
  const max = options.max ?? 5;
  const selected = candidates.slice(0, max);

  const snapshots = await Promise.all(selected.map(snapshotCompetitor));
  return Promise.all(snapshots.map((snapshot) => analyzeSnapshot(snapshot, options.timeoutMs)));
}
