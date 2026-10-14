import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '../_shared/rate-limit.ts';
import { runReadinessScan } from '../_shared/readiness-scan.ts';
const RATE_LIMIT_PER_MINUTE = 10;
interface RequestBody { siteId: string; }
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let activeScanId: string | undefined;
  let database: SupabaseClient | undefined;
  if (req.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}), {status:405,headers:corsHeaders});
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    database = supabase;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(supabase, clientIp, 'run-scan', RATE_LIMIT_PER_MINUTE, 60);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders(ipLimit),
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const { siteId }: RequestBody = await req.json();

    if (!siteId) {
      throw new Error('Missing siteId');
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (siteError || !site) {
      throw new Error('Site not found or unauthorized');
    }

    const recentScansResult = await supabase
      .from('scans')
      .select('created_at')
      .eq('site_id', siteId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentScansResult.data && recentScansResult.data.length >= 5) {
      throw new Error('Rate limit: Maximum 5 scans per hour per site');
    }

    const { data: newScan, error: insertError } = await supabase
      .from('scans')
      .insert({
        site_id: siteId,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !newScan) {
      throw new Error('Failed to create scan');
    }

    activeScanId = newScan.id;
    const result = await runReadinessScan(site.url);
    const { error: updateError } = await supabase.from('scans').update({
      status: 'completed', overall_score: result.overall_score,
      analysis_json: result.analysis_json, v2_score: result.v2_score,
      v2_evidence: result.v2_evidence, completed_at: new Date().toISOString(),
    }).eq('id', newScan.id);
    if (updateError) throw new Error('Failed to save scan results');
    await supabase.from('sites').update({ last_scanned_at: new Date().toISOString() }).eq('id', siteId);
    const { data: updatedScan } = await supabase.from('scans').select('*').eq('id', newScan.id).single();
    return new Response(JSON.stringify(updatedScan), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    if (database && activeScanId) await database.from('scans').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', activeScanId);
    console.error('Scan request failed');
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to complete scan' }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
