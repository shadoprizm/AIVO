# AIVO Free-First Relaunch Validation Notes

## Task 0 - Branch and Baseline Validation

Branch created: `feature/free-first-relaunch`

Commands run:

- `npm install --no-audit --no-fund`: passed. `package-lock.json` changed and is intentionally left uncommitted until dependency changes are needed.
- `npm run typecheck`: failed before relaunch changes.
- `npm run lint`: failed before relaunch changes.
- `npm run build`: passed. The build regenerated `public/sitemap.xml`; this generated change is intentionally left uncommitted until Task 2.

Baseline `typecheck` failures:

- `src/components/features/ScanDetailsModal.tsx`: compares `implementation_effort` against unsupported `"easy"` value.
- `src/contexts/AuthContext.tsx`: implicit `any` in the auth context function types.
- `src/pages/BlogPost.tsx`: related post query result does not satisfy the `BlogPost` interface.
- `src/pages/SiteDetail.tsx`: unused `ArrowLeft` import and nullable `overall_score` in trend rendering.
- `src/utils/pdfExport.ts`: missing `jspdf` and `jspdf-autotable` packages, implicit `any`, and unsupported `"easy"` effort comparison.

Baseline `lint` failures:

- `src/contexts/AuthContext.tsx`: explicit `any` in auth function return types.
- `src/pages/FAQ.tsx`: explicit `any` in schema text extraction.
- `src/pages/SiteDetail.tsx`: unused import and hook dependency warnings.
- `src/utils/pdfExport.ts`: explicit `any`.
- `supabase/functions/generate-blog/index.ts`: explicit `any`, unused `isSameDay`, and unused `updateStateError`.
- `supabase/functions/run-scan/index.ts`: `faqLinkFound` shadowing/unused variable issues.

## Task 1 - Restore Baseline

Fixes applied:

- Typed auth context return values and documented the colocated provider/hook Fast Refresh exception.
- Replaced `any` traversal in FAQ schema extraction with `ReactNode`/`isValidElement` recursion.
- Fixed related blog post selection so it satisfies the `BlogPost` interface.
- Fixed Site Detail hook dependencies and nullable score trend rendering.
- Removed unused `src/utils/pdfExport.ts`; it was not imported by any report or print flow.
- Fixed lint issues in existing Edge Functions without changing scan/blog behavior.
- Kept the `npm install` lockfile sync from Task 0 because `package-lock.json` was out of sync with `package.json`.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`; these are existing warnings and do not fail the build.

## Task 2 - Resilient Sitemap

Fixes applied:

- `scripts/generate-sitemap.js` now generates the core static sitemap when Supabase env vars are missing.
- Missing env now logs a warning and does not call `process.exit(1)`.
- Dynamic blog URLs are included only when Supabase env vars are available and the query succeeds.
- Dynamic fetch failures fall back to the static sitemap.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build` with `.env` temporarily moved to `.env.bak`: passed.
- Confirmed `public/sitemap.xml` exists and contains only the eight required static routes in no-env mode.
- No-env prerender logged footer timeout warnings for prerendered routes because frontend Supabase env was absent; the build exited successfully.

## Task 3 - Centralize Config

Fixes applied:

- Added `src/config/site.ts` as the frontend source of truth for name, domain, canonical URL, description, and support email.
- Replaced frontend domain literals in SEO metadata, schema objects, breadcrumbs, and footer links with `SITE` values.
- Updated sitemap generation to use `VITE_SITE_URL` with a documented production fallback.
- Documented the remaining intentional production domain literals in static HTML, `robots.txt`, generated sitemap output, and Edge Function fallbacks.

Verification:

- `rg "aivoinsights\\.com" src scripts supabase public index.html`: remaining matches are intentional canonical/static fallbacks or generated sitemap absolute URLs.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- First `npm run build` failed because `%VITE_SITE_URL%` in `index.html` has no safe fallback when the env var is absent locally. Static HTML canonical tags were restored with an explanatory comment.
- Final `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 4 - Remove Paid-Plan Language

Fixes applied:

- Replaced free-tier/paid-plan/credit-card copy with free-first benchmark positioning.
- Updated privacy, FAQ, and terms references from OpenAI to DeepSeek V4.
- Preserved Terms abuse and rate-limit language.
- Removed user-facing credit-card copy from the shared hero component.
- Documented the remaining `subscription` matches as Supabase auth listener API names, not paid-plan language.

Verification:

- `rg "paid|pricing|tier|credit card|subscription|Stripe|checkout" src`: only Supabase auth listener `subscription` property names remain, with code comments.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 5 - Migrate Blog Generation to DeepSeek V4

Fixes applied:

- Replaced blog generation OpenAI env/API usage with direct DeepSeek V4 `/chat/completions` fetch.
- Switched required secrets to `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, and `DEEPSEEK_MODEL`.
- Set blog generation temperature to `0.7` and `max_tokens` to `2000`.
- Updated blog automation script documentation to reference DeepSeek V4.

Verification:

- `rg "OpenAI|OPENAI|openai|gpt-4o|api.openai" supabase/functions/generate-blog scripts src/pages/Dashboard.tsx`: no matches.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 6 - Anonymous Scan Schema

Fixes applied:

- Added a migration for anonymous scan metadata, public tokens, v2 JSON fields, request hashes, request domain, source, and nullable direct scan ownership.
- Preserved the existing scan status values to avoid adding a duplicate `status` column.
- Updated RLS so authenticated users can select scans they own directly or through the related site, with no public table SELECT policy.
- Updated frontend database types for nullable site ownership and public scan fields.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 7 - Shared Scan Modules

Fixes applied:

- Added shared scan interfaces, URL normalization/private IP checks, timeout and max-byte fetching, site discovery, and deterministic technical checks.
- Discovery fetches homepage, robots.txt, llms.txt, sitemap.xml, top sitemap URLs, and internal page candidates.
- Technical checks cover AI crawler robots rules, llms.txt, sitemap XML, canonical/title/meta, schema, social metadata, H1/heading order, FAQ schema, and CSR shell risk.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 8 - DeepSeek V4 Analysis Module

Fixes applied:

- Added `deepseek-analyzer.ts` using direct `fetch` to `DEEPSEEK_BASE_URL/chat/completions`.
- Uses `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, temperature `0.1`, JSON response format, and `max_tokens` `4000`.
- Implements anonymous/authenticated timeout helper, one retry on 429/503, and null-on-failure degradation behavior.
- Prompt enforces evidence-backed recommendations and strict JSON output.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 9 - V2 Scoring and Answer Tests

Fixes applied:

- Added `AIVOScoreV2` with documented category weights.
- Added capped AI Answer Simulation prompt generation and DeepSeek-backed answer test execution.
- Answer simulation returns at most two structured records and never claims to test ChatGPT.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 10 - Public Scan Edge Function

Fixes applied:

- Added `public-scan` Edge Function with URL validation, normalization, private URL blocking, keyed IP/user-agent hashing, IP/domain rate limits, anonymous site/scan creation, technical checks, DeepSeek analysis, answer simulations, and partial degradation mode.
- Strengthened shared fetch redirects to cap at three and block unsafe redirect targets.
- Public API returns `complete` or `partial` while preserving the existing database scan status values.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 11 - Public Report Edge Function

Fixes applied:

- Added `public-report` Edge Function for public token lookup using the Supabase service role.
- Returns report data for `unlisted` and `public` scans only.
- Returns 404 for invalid tokens, missing reports, and private scans to prevent enumeration.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 12 - Public Scan Form and Report Page

Fixes applied:

- Added public scan client wrapper and hero URL form.
- Integrated the form into the existing hero.
- Added `/report/:token` route with noindex meta handling, public report fetch, v2 scores, evidence, recommendations, answer simulations, copy-link sharing, and account CTA.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 13 - OAuth Auth

Fixes applied:

- Added Google and GitHub OAuth helpers to the auth context.
- Added reusable OAuth buttons with loading/error states and free-account note.
- Integrated OAuth options above email/password fallback on login and signup.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 14 - Claim Scan Edge Function

Fixes applied:

- Added authenticated `claim-scan` Edge Function.
- Verifies the JWT with Supabase Auth, validates public token shape, rejects missing/already-claimed reports, and sets `scans.user_id` plus `visibility = private`.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 15 - Claim Flow and Dashboard

Fixes applied:

- Added frontend claim call and auto-claim behavior for authenticated users viewing an unclaimed report.
- Preserved report return path through OAuth using session storage.
- Updated email login/signup to honor report redirect paths.
- Updated dashboard copy to include saved public reports.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 16 - Report Components

Fixes applied:

- Added report component system for header, score summary, technical findings, answer simulations, sortable recommendations, share actions, and shared report types.
- Reworked the public report page to use the new report components.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.

## Task 17 - Share and Export Actions

Fixes applied:

- Hardened report share/export actions with clipboard error handling and visible action feedback.
- Added markdown developer checklist, markdown content brief fallback, print action, and dated JSON evidence download.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Prerender still logs footer timeout warnings for `/login` and `/signup`.
