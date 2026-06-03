import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '../_shared/rate-limit.ts';

const RATE_LIMIT_PER_MINUTE = 20;
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

interface RequestBody {
  query?: string;
}

interface PexelsPhoto {
  src?: { large2x?: string; large?: string; original?: string };
  photographer?: string;
  photographer_url?: string;
  alt?: string;
}

// Admin-gated proxy for Pexels image search. Keeps the Pexels API key on the
// server (Deno.env) instead of shipping it to the browser via a VITE_ var.
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pexelsKey =
      Deno.env.get('PEXELS_API_KEY') ?? Deno.env.get('VITE_PEXELS_API_KEY') ?? null;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing authorization header');
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Admin check — single source of truth is the admin_users table.
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!adminRow) {
      throw new Error('Only administrators can search images');
    }

    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(supabase, clientIp, 'search-image', RATE_LIMIT_PER_MINUTE, 60);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }),
        {
          status: 429,
          headers: { ...corsHeaders, ...rateLimitHeaders(ipLimit), 'Content-Type': 'application/json' },
        },
      );
    }

    if (!pexelsKey) {
      return new Response(
        JSON.stringify({ error: 'Image search is not configured. Set PEXELS_API_KEY on the function.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { query }: RequestBody = await req.json().catch(() => ({}));
    const q = (query ?? '').toString().trim() || 'AI visibility';

    const url = `${PEXELS_API_URL}?query=${encodeURIComponent(q)}&orientation=landscape&per_page=40`;
    const response = await fetch(url, { headers: { Authorization: pexelsKey } });
    if (!response.ok) {
      throw new Error('Image provider returned an error');
    }

    const data = await response.json();
    const images = ((data.photos ?? []) as PexelsPhoto[])
      .map((p) => ({
        url: p.src?.large2x ?? p.src?.large ?? p.src?.original ?? '',
        photographer: p.photographer ?? '',
        photographerUrl: p.photographer_url ?? '',
        alt: p.alt ?? '',
      }))
      .filter((i) => i.url);

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, ...rateLimitHeaders(ipLimit), 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const status =
      message === 'Unauthorized' || message.startsWith('Only administrators') ? 403 : 400;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
