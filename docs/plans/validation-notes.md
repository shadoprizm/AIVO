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
