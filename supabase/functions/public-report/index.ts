import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PublicReportRequest {
  token?: unknown;
}

interface ReportSite {
  id: string;
  name: string;
  url: string;
}

interface PublicReportRow {
  id: string;
  public_token: string;
  visibility: 'private' | 'unlisted' | 'public' | null;
  status: string;
  overall_score: number | null;
  v2_score: Record<string, unknown> | null;
  v2_evidence: Record<string, unknown> | null;
  analysis_json: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
  sites: ReportSite | ReportSite[] | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getSite(value: ReportSite | ReportSite[] | null): ReportSite | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
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

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Public reports are not configured' }, 500);
    }

    const body = await req.json().catch(() => null) as PublicReportRequest | null;
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return jsonResponse({ error: 'Report not found' }, 404);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from('scans')
      .select('id, public_token, visibility, status, overall_score, v2_score, v2_evidence, analysis_json, created_at, completed_at, sites(id, name, url)')
      .eq('public_token', token)
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: 'Unable to load report' }, 500);
    }

    const scan = data as PublicReportRow | null;
    if (!scan || scan.visibility === 'private') {
      return jsonResponse({ error: 'Report not found' }, 404);
    }

    const evidence = scan.v2_evidence ?? {};
    const site = getSite(scan.sites);

    return jsonResponse({
      scanId: scan.id,
      publicToken: scan.public_token,
      visibility: scan.visibility,
      status: evidence.analysis_status ?? (scan.status === 'completed' ? 'complete' : 'partial'),
      score: scan.v2_score ?? { overall: scan.overall_score },
      evidence,
      recommendations: evidence.recommendations ?? [],
      answerTests: evidence.answer_tests ?? [],
      legacyAnalysis: scan.analysis_json,
      site,
      createdAt: scan.created_at,
      completedAt: scan.completed_at,
    });
  } catch {
    return jsonResponse({ error: 'Unable to load report' }, 500);
  }
});
