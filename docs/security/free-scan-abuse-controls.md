# Free Scan Abuse Controls

This document records the abuse controls required for the AIVO free-first public scan flow and the related authenticated scan path.

## Verified Controls

- SSRF blocked for localhost and private IP literals before fetch.
- DNS-based private address checks are applied when Deno DNS resolution is available.
- Redirects are capped at 3 through the shared fetch helper.
- Redirect targets must remain HTTPS and cannot point to localhost or private IP literals.
- Fetch timeout is enforced at 8 seconds for primary public page fetches.
- Max bytes are enforced at 100KB per page for scan content.
- Anonymous discovery page count limits are enforced in the shared discovery module.
- Rate limits are enforced for anonymous public scans: 3 scans per IP per day and 1 scan per domain per day.
- IP and user-agent rate-limit keys use `SCAN_HASH_SECRET` and are not stored in plaintext.
- Public tokens are generated from 32 random bytes and stored as unguessable 64-character hex values.
- Anonymous report lookup requires an exact public token and rejects private reports.
- Public access to scan data is through Edge Functions using service-role lookup only; there is no broad public table listing path.
- Service role keys are used only in Supabase Edge Functions and are not present in frontend code.
- DeepSeek V4 failures degrade to deterministic technical scores instead of failing the public scan.
- Feedback submission is insert-only through an Edge Function and has no public listing endpoint.
- Authenticated dashboard scans now use the shared fetch helper and direct DeepSeek V4 fetches.

## Manual Curl Tests

Replace `https://your-project.supabase.co/functions/v1/public-scan` with the deployed function URL.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/public-scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000"}'
```

Expected: HTTP 400 with a blocked unsafe URL error.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/public-scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.1.1"}'
```

Expected: HTTP 400 with a blocked unsafe URL error.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/public-scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://127.0.0.1"}'
```

Expected: HTTP 400 with a blocked unsafe URL error.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/public-report \
  -H "Content-Type: application/json" \
  -d '{"token": "0000000000000000000000000000000000000000000000000000000000000000"}'
```

Expected: HTTP 404. Invalid or private reports must not reveal scan details.

## Operational Requirements

- Configure `SCAN_HASH_SECRET` before deploying `public-scan`.
- Configure `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, and `DEEPSEEK_MODEL`; do not configure legacy LLM provider environment variables for production paths.
- Review Supabase logs for repeated blocked URL attempts, rate-limit errors, and DeepSeek degradation events after launch.
- Keep Edge Function CORS permissive only for required methods and avoid adding public list endpoints for reports or feedback.
