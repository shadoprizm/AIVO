import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { analyzeWithDeepSeek, getDeepSeekTimeoutMs } from '../_shared/deepseek-analyzer.ts';
import { runAnswerSimulations } from '../_shared/answer-tests.ts';
import { discoverSite } from '../_shared/site-discovery.ts';
import { runTechnicalChecks } from '../_shared/technical-checks.ts';
import { isPrivateIp, isValidUrl, normalizeUrl } from '../_shared/url.ts';
import { AIVOScoreV2, ScanAnalysis, ScanInput, TechnicalCheckResult } from '../_shared/analysis-types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PublicScanRequest {
  url?: unknown;
}

interface PublicScanResponse {
  scanId: string;
  publicToken: string;
  reportUrl: string;
  status: 'complete' | 'partial';
  message?: string;
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return req.headers.get('cf-connecting-ip') ?? forwardedFor ?? 'unknown';
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function createPublicToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hostnameResolvesToPrivate(hostname: string): Promise<boolean> {
  // SECURITY: block private DNS results where Deno DNS resolution is available.
  for (const recordType of ['A', 'AAAA'] as const) {
    try {
      const records = await Deno.resolveDns(hostname, recordType);
      if (records.some((record) => isPrivateIp(record))) {
        return true;
      }
    } catch {
      // DNS resolution can fail for valid public hosts. The fetch path still blocks private literals and redirects.
    }
  }
  return false;
}

function domainFromUrl(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
}

function technicalOnlyAnalysis(technical: TechnicalCheckResult): ScanAnalysis {
  return {
    scores: technical.scores,
    recommendations: technical.recommendations,
    summary: 'Technical checks completed. AI analysis is temporarily unavailable.',
  };
}

function toV2Score(analysis: ScanAnalysis): AIVOScoreV2 {
  return {
    crawl_access: analysis.scores.crawl_access,
    entity_clarity: analysis.scores.entity_clarity,
    answer_readiness: analysis.scores.answer_readiness,
    citation_likelihood: analysis.scores.citation_likelihood,
    trust_evidence: analysis.scores.trust_evidence,
    competitive_presence: analysis.scores.competitive_presence,
    overall: analysis.scores.overall,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const hashSecret = Deno.env.get('SCAN_HASH_SECRET');

    if (!supabaseUrl || !serviceRoleKey || !hashSecret) {
      return jsonResponse({ error: 'Public scan is not configured' }, 500);
    }

    const body = await req.json().catch(() => null) as PublicScanRequest | null;
    if (!body || typeof body.url !== 'string' || body.url.trim().length === 0) {
      return jsonResponse({ error: 'A valid URL is required.' }, 400);
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(body.url);
    } catch {
      return jsonResponse({ error: 'Enter a valid public website URL.' }, 400);
    }

    if (!isValidUrl(normalizedUrl)) {
      return jsonResponse({ error: 'Enter a valid public HTTPS website URL.' }, 400);
    }

    const parsedUrl = new URL(normalizedUrl);
    // SECURITY: block localhost/private IP literals and private DNS answers before fetching.
    if (isPrivateIp(parsedUrl.hostname) || await hostnameResolvesToPrivate(parsedUrl.hostname)) {
      return jsonResponse({ error: 'Private, localhost, and internal network URLs cannot be scanned.' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const domain = domainFromUrl(normalizedUrl);
    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') ?? 'unknown';
    const ipHash = await hmacSha256(hashSecret, ip);
    const userAgentHash = await hmacSha256(hashSecret, userAgent);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: ipCount, error: ipLimitError } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('request_ip_hash', ipHash)
      .gte('created_at', since);

    if (ipLimitError) {
      return jsonResponse({ error: 'Unable to verify scan rate limit' }, 500);
    }

    if ((ipCount ?? 0) >= 3) {
      return jsonResponse({ error: 'Rate limit reached: 3 scans per day from this network.' }, 429);
    }

    const { count: domainCount, error: domainLimitError } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('request_domain', domain)
      .gte('created_at', since);

    if (domainLimitError) {
      return jsonResponse({ error: 'Unable to verify domain rate limit' }, 500);
    }

    if ((domainCount ?? 0) >= 1) {
      return jsonResponse({ error: 'Rate limit reached: this domain has already been scanned today.' }, 429);
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        user_id: null,
        name: domain,
        url: normalizedUrl,
      })
      .select('id')
      .single();

    if (siteError || !site) {
      return jsonResponse({ error: 'Failed to create scan site record.' }, 500);
    }

    const publicToken = createPublicToken();
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        site_id: site.id,
        user_id: null,
        public_token: publicToken,
        visibility: 'unlisted',
        request_ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        request_domain: domain,
        source: 'public',
        status: 'processing',
      })
      .select('id')
      .single();

    if (scanError || !scan) {
      return jsonResponse({ error: 'Failed to create scan record.' }, 500);
    }

    const discoveredSite = await discoverSite(normalizedUrl, 6);
    const technical = runTechnicalChecks(discoveredSite);
    const scanInput: ScanInput = { site: discoveredSite, technical };
    const llmAnalysis = await analyzeWithDeepSeek(scanInput, getDeepSeekTimeoutMs('anonymous'));
    const answerTests = llmAnalysis ? await runAnswerSimulations(discoveredSite, 20_000) : [];
    const analysis = llmAnalysis ?? technicalOnlyAnalysis(technical);
    const publicStatus: PublicScanResponse['status'] = llmAnalysis ? 'complete' : 'partial';
    const message = publicStatus === 'partial'
      ? 'AI analysis processing — rescan in 60 seconds for full report'
      : undefined;
    const v2Score = toV2Score(analysis);
    const v2Evidence = {
      analysis_status: publicStatus,
      message,
      summary: analysis.summary,
      crawl: discoveredSite.evidence,
      technical,
      recommendations: analysis.recommendations,
      answer_tests: answerTests,
    };

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        overall_score: v2Score.overall,
        v2_score: v2Score,
        v2_evidence: v2Evidence,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id);

    if (updateError) {
      return jsonResponse({ error: 'Failed to save scan results.' }, 500);
    }

    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://aivoinsights.com').replace(/\/$/, '');
    const response: PublicScanResponse = {
      scanId: scan.id,
      publicToken,
      reportUrl: `${siteUrl}/report/${publicToken}`,
      status: publicStatus,
      ...(message && { message }),
    };

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unable to complete scan.',
    }, 500);
  }
});
