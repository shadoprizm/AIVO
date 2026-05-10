import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const usefulnessValues = ['yes', 'no', 'partial'] as const;
const roleValues = ['owner', 'marketer', 'developer', 'agency', 'other'] as const;

interface FeedbackRequest {
  public_token?: unknown;
  usefulness?: unknown;
  role?: unknown;
  free_text?: unknown;
  email?: unknown;
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

function isUsefulness(value: unknown): value is typeof usefulnessValues[number] {
  return typeof value === 'string' && usefulnessValues.includes(value as typeof usefulnessValues[number]);
}

function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
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
      return jsonResponse({ error: 'Feedback is not configured' }, 500);
    }

    const body = await req.json().catch(() => null) as FeedbackRequest | null;
    const publicToken = typeof body?.public_token === 'string' ? body.public_token.trim() : '';
    if (!/^[a-f0-9]{64}$/i.test(publicToken) || !isUsefulness(body?.usefulness)) {
      return jsonResponse({ error: 'Invalid feedback payload' }, 400);
    }

    const role = typeof body.role === 'string' && roleValues.includes(body.role as typeof roleValues[number])
      ? body.role
      : null;
    const email = normalizeOptionalText(body.email, 254);
    const freeText = normalizeOptionalText(body.free_text, 2000);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase
      .from('scan_feedback')
      .insert({
        public_token: publicToken,
        usefulness: body.usefulness,
        role,
        free_text: freeText,
        email,
      });

    if (error) {
      return jsonResponse({ error: 'Unable to submit feedback' }, 500);
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: 'Unable to submit feedback' }, 500);
  }
});
