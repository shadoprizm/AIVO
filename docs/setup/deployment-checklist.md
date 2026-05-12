# AIVO Free-First Deployment Checklist

Use this checklist before promoting the free-first relaunch to production.

## Vercel Environment Variables

```plain
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=https://aivoinsights.com
VITE_GA_MEASUREMENT_ID= (optional)
VITE_ADMIN_EMAILS=
```

## Supabase Edge Function Secrets

```plain
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
SCAN_HASH_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
```

## Supabase Configuration

- [ ] Apply all migrations in `supabase/migrations`.
- [ ] Deploy Edge Functions: `public-scan`, `public-report`, `claim-scan`, `scan-feedback`, `run-scan`, `generate-blog`, and `admin-control`.
- [ ] In Supabase Dashboard -> Authentication -> URL Configuration, set Site URL to `https://aivoinsights.com`.
- [ ] Add production redirect URLs in Supabase URL Configuration: `https://aivoinsights.com/dashboard`, `https://aivoinsights.com/report/**`, `https://aivoinsights.com/sites/**`, `https://aivoinsights.com/admin`, and `https://aivoinsights.com/admin/**`.
- [ ] Add local redirect URL in Supabase URL Configuration: `http://localhost:5173/**`.
- [ ] Create a Google OAuth client with authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, then enable Google in Supabase Dashboard -> Authentication -> Providers with that client ID and secret.
- [ ] Create a GitHub OAuth app with authorization callback URL `https://<project-ref>.supabase.co/auth/v1/callback`, then enable GitHub in Supabase Dashboard -> Authentication -> Providers with that client ID and secret.
- [ ] Confirm public report lookup uses service-role token lookup only.
- [ ] Confirm anonymous feedback has no public listing endpoint.

## Vercel Build And Site Files

- [ ] `npm install --no-audit --no-fund` completes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `public/llms.txt` is deployed.
- [ ] `public/sitemap.xml` includes GEO landing pages.
- [ ] `public/robots.txt` is deployed.
- [ ] Production site serves route-specific metadata for GEO pages.

## Launch Smoke Readiness

- [ ] Public scan for `https://aivoinsights.com` returns a report.
- [ ] Report URL works while signed out.
- [ ] DeepSeek timeout or secret removal returns partial deterministic results.
- [ ] Google OAuth can save or claim a public report.
- [ ] GitHub OAuth can sign in and reach dashboard.
- [ ] Dashboard scan works for authenticated users.
- [ ] Analytics events arrive without PII.
- [ ] Rate limits and SSRF blocks are verified with curl tests.
