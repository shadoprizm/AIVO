import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
import { isPrivateIp, isValidUrl, normalizeUrl } from '../_shared/url.ts';
import { runReadinessScan } from '../_shared/readiness-scan.ts';
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

async function hasActivePublicScanBlock(
  supabase: SupabaseClient,
  domain: string,
  requestIpHash: string,
  userAgentHash: string
): Promise<boolean> {
  const now = new Date().toISOString();

  for (const [field, value] of [
    ['domain', domain],
    ['request_ip_hash', requestIpHash],
    ['user_agent_hash', userAgentHash],
  ] as const) {
    const { data, error } = await supabase
      .from('admin_abuse_blocks')
      .select('id')
      .eq('active', true)
      .eq(field, value)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1);

    if (error) {
      throw new Error('Unable to verify scan access');
    }

    if (data?.length) {
      return true;
    }
  }

  return false;
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let activeScanId: string | undefined;
  let database: SupabaseClient | undefined;
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
    database = supabase;
    const domain = domainFromUrl(normalizedUrl);
    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') ?? 'unknown';
    const ipHash = await hmacSha256(hashSecret, ip);
    const userAgentHash = await hmacSha256(hashSecret, userAgent);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (await hasActivePublicScanBlock(supabase, domain, ipHash, userAgentHash)) {
      return jsonResponse({ error: 'This scan request is blocked.' }, 403);
    }

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

    activeScanId = scan.id;
    const result = await runReadinessScan(normalizedUrl);
    const publicStatus: PublicScanResponse['status'] = result.v2_evidence.analysis_status === 'complete' ? 'complete' : 'partial';
    const message = result.v2_evidence.message;
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        overall_score: result.overall_score,
        analysis_json: result.analysis_json,
        v2_score: result.v2_score,
        v2_evidence: result.v2_evidence,
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
    if (database && activeScanId) await database.from('scans').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', activeScanId);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unable to complete scan.',
    }, 500);
  }
});
