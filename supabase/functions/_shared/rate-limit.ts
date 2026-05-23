import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const windowStartSec = Math.floor(nowMs / 1000 / windowSeconds) * windowSeconds;
  const windowStart = new Date(windowStartSec * 1000).toISOString();
  const reset = (windowStartSec + windowSeconds) * 1000;
  const key = `${endpoint}:${ip}`;

  // Single round-trip: increment via RPC. On error/exception, fail-open to avoid breaking the app.
  try {
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_key: key,
      p_window_start: windowStart,
    });

    if (error) {
      console.error('rate_limit_rpc_error', error);
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset,
        retryAfter: 0,
      };
    }

    const count = typeof data === 'number' ? data : Number(data ?? 0);
    const remaining = Math.max(0, limit - count);
    const allowed = count <= limit;
    const retryAfter = allowed ? 0 : Math.max(1, Math.ceil((reset - nowMs) / 1000));

    return { allowed, limit, remaining, reset, retryAfter };
  } catch (err) {
    console.error('rate_limit_exception', err);
    return { allowed: true, limit, remaining: limit, reset, retryAfter: 0 };
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
  };
  if (!result.allowed && result.retryAfter > 0) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}
