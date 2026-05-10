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
