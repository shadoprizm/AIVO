export const ALLOWED_ORIGINS = [
  'https://aivoinsights.com',
  'https://www.aivoinsights.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const DEFAULT_ORIGIN = 'https://aivoinsights.com';

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : DEFAULT_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
