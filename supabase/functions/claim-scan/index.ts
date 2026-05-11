import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ClaimScanRequest {
  publicToken?: unknown;
}

interface ScanRow {
  id: string;
  user_id: string | null;
  public_token: string | null;
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

async function isUserBlockedFromClaims(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const [{ data: moderation, error: moderationError }, { data: abuseBlock, error: abuseBlockError }] = await Promise.all([
    supabase
      .from('user_moderation')
      .select('user_id')
      .eq('user_id', userId)
      .eq('status', 'suspended')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1),
    supabase
      .from('admin_abuse_blocks')
      .select('id')
      .eq('active', true)
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1),
  ]);

  if (moderationError || abuseBlockError) {
    throw new Error('Unable to verify account access');
  }

  return Boolean(moderation?.length || abuseBlock?.length);
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
      return jsonResponse({ error: 'Claim flow is not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const body = await req.json().catch(() => null) as ClaimScanRequest | null;
    const publicToken = typeof body?.publicToken === 'string' ? body.publicToken.trim() : '';
    if (!/^[a-f0-9]{64}$/i.test(publicToken)) {
      return jsonResponse({ error: 'Report not found' }, 404);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    if (await isUserBlockedFromClaims(supabase, user.id)) {
      return jsonResponse({ error: 'Account suspended' }, 403);
    }

    const { data, error } = await supabase
      .from('scans')
      .select('id, user_id, public_token')
      .eq('public_token', publicToken)
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: 'Unable to load scan' }, 500);
    }

    const scan = data as ScanRow | null;
    if (!scan) {
      return jsonResponse({ error: 'Report not found' }, 404);
    }

    if (scan.user_id) {
      return jsonResponse({ error: 'This report has already been claimed.' }, 409);
    }

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        user_id: user.id,
        visibility: 'private',
      })
      .eq('id', scan.id)
      .is('user_id', null);

    if (updateError) {
      return jsonResponse({ error: 'Unable to claim report' }, 500);
    }

    return jsonResponse({
      success: true,
      scanId: scan.id,
    });
  } catch {
    return jsonResponse({ error: 'Unable to claim report' }, 500);
  }
});
