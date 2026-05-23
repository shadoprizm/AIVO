# Security Operations

This document tracks the security hardening applied to aivoinsights.com
and the manual actions that must be completed outside this repository.

## Implemented in this repository

| Mitigation | File |
| --- | --- |
| HSTS with `includeSubDomains; preload` | `vercel.json` (`Strict-Transport-Security`) |
| Content-Security-Policy (no `unsafe-eval`) | `vercel.json` (`Content-Security-Policy`) |
| Clickjacking (`X-Frame-Options: DENY` + `frame-ancestors 'none'`) | `vercel.json` |
| MIME sniffing protection | `vercel.json` (`X-Content-Type-Options`) |
| Referrer-Policy, Permissions-Policy | `vercel.json` |
| COOP `same-origin`, CORP `same-origin` | `vercel.json` |
| Legacy `X-XSS-Protection`, `X-Download-Options`, `X-Permitted-Cross-Domain-Policies` | `vercel.json` |
| HTTP 404 for `/.git`, `/.env*`, `/backup*`, `*.bak`, `*.sql`, `*.dump`, `*.zip`, `*.tar.gz`, `/wp-admin`, `/wp-login`, `/debug`, `/swagger*`, `/openapi*`, `/actuator*`, `/_debugbar*` | `vercel.json` rewrites |
| Edge Function CORS allowlist (production + localhost) | `supabase/functions/_shared/cors.ts` |
| Per-IP sliding-window rate limit on `run-scan` (10/min) and `generate-blog` (5/min) | `supabase/functions/_shared/rate-limit.ts`, `supabase/migrations/20260523000000_create_rate_limits_table.sql` |

### CSP trade-offs

- `script-src 'self' 'unsafe-inline'` — required because pages render
  JSON-LD blocks via `dangerouslySetInnerHTML` (Home, HowItWorks, Blog,
  BlogPost, FAQ, Breadcrumbs). `unsafe-eval` is **not** allowed.
- `style-src 'self' 'unsafe-inline'` — required for React `style={{}}`
  props used in hero/animation components and `ScanDetailsModal`.
- `img-src 'self' data: https:` — `https:` allows Pexels-hosted blog
  cover images and any inline SVG data URIs.
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co` —
  Supabase REST + Auth + Realtime websocket.
- COEP is intentionally **omitted**. Setting `require-corp` would block
  cross-origin images (Pexels) loaded by blog posts.

## Manual steps (must be done outside the repo)

### 1. DMARC TXT record (HIGH)

Add at the registrar (Namecheap, based on the current SPF host):

```
Host:  _dmarc
Type:  TXT
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@aivoinsights.com; pct=100; adkim=s; aspf=s
```

Once reports arrive cleanly for a few weeks, promote `p=quarantine` to
`p=reject`.

### 2. CAA records (MEDIUM)

Vercel issues certificates through Let's Encrypt. Add:

```
Host:  @
Type:  CAA
Value: 0 issue "letsencrypt.org"
```

If Vercel ever rotates to another CA (e.g., Sectigo, DigiCert), add a
matching record before the switch or certificate renewal will fail.

### 3. SPF tightening (LOW)

Current record ends with `~all` (softfail). After two to four weeks of
DMARC monitoring with no legitimate senders being missed, replace it
with:

```
v=spf1 include:spf.efwd.registrar-servers.com -all
```

### 4. HSTS preload submission

Prerequisites are already met by the deployed `Strict-Transport-Security`
header (`max-age=63072000; includeSubDomains; preload`). After the
header is verified live on production:

1. Confirm every subdomain serves valid HTTPS.
2. Submit at https://hstspreload.org.
3. Inclusion in Chromium/Firefox/Safari ships in subsequent browser
   releases (weeks to months).

### 5. `Server: Vercel` header

Vercel sets this header at the edge and does not expose a customer
configuration to remove it. This is platform-controlled and accepted as
residual risk. Versions are not disclosed.

## Verification checklist

After deploying:

```bash
# Headers present and CSP free of unsafe-eval
curl -sI https://aivoinsights.com/ \
  | grep -iE 'strict-transport|content-security|x-frame|x-content-type|referrer|permissions|cross-origin'

# Blocked paths return 404 (not the SPA shell)
for p in .git/config .env.bak wp-admin/ backup.sql backup.zip debug swagger.json openapi.json; do
  curl -so /dev/null -w "%{http_code} /$p\n" "https://aivoinsights.com/$p"
done

# CORS allowlist
curl -i -X OPTIONS \
  -H 'Origin: https://evil.com' \
  -H 'Access-Control-Request-Method: POST' \
  https://<project>.supabase.co/functions/v1/run-scan
# → Access-Control-Allow-Origin: https://aivoinsights.com (NOT evil.com)
```

Apply the migration to remote Supabase:

```bash
supabase db push
```

Confirm the rate-limit table and helper exist:

```sql
select count(*) from public.rate_limits;
select pg_get_functiondef('public.increment_rate_limit'::regproc);
```
