# Scanner readiness v3 — October 14, 2026

Both account and free scans use `runReadinessScan`. The model default is `gpt-6-luna`, configurable through `AIVO_SCAN_MODEL`; authentication uses the existing protected `OPENAI_API_KEY` in Supabase. Blog generation remains separate.

## What is measured

- Up to five public HTML pages, prioritizing product/service, about and contact pages.
- HTML capture is bounded at 1 MB per page and 100 KB per system file. Truncated HTML and fetch failures are disclosed.
- Parsed titles, descriptions, canonical links, heading hierarchy and valid JSON-LD types.
- Luna's editorial content clarity, customer-answer and expertise estimates require a matching page URL and verbatim excerpt from captured text. Unsupported quotes are rejected.
- The overall readiness score averages assessed categories only. Unassessed categories appear as “Not assessed.” Rescan charts compare only the same analysis version and exclude partial assessments.

Actual AI-engine citations, competitor rankings, search indexing, mobile usability and performance are not tested. Simulated answers are not used to fabricate visibility metrics. Missing FAQs or llms.txt do not trigger an automatic score ceiling.

## Verification

- Deno regression tests cover large inline styles, metadata attribute order, schema type arrays, invented evidence, truncated evidence, model failure, Luna request compatibility and bounded response capture.
- Edge Function type checks, frontend type checks, lint and production build.
- Current-site capture checks for the five October 9 lighting sites. LUM's full homepage contains over 6,000 visible characters; the previous 100 KB capture saw essentially its title.
- A live public LUM scan completed using `gpt-6-luna`, with a saved report and 5 captured pages. Account scans use the identical engine; authorization remains account-based.
- Existing administrator-registry and PDF fixes were carried from the owner's dirty checkout. The original checkout was not modified.

## Release and rollback

Keep JWT verification enabled for both scan endpoints and public-report. Public clients send the existing legacy anon JWT plus apikey; account scans validate the user's bearer token and site ownership. Public rate limits, moderation blocks and unlisted-report tokens remain enforced.

Deploy public-scan and verify a model-backed report before replacing run-scan. Deploy the frontend with the public-request headers and the same commit metadata. Keep an export of the prior live Edge Function source for rollback. Do not modify the five October 9 reports.

## Further work

Calibrate editorial scores against reviewed fixtures, improve extraction on unusual layouts, add actual cited-response testing as a clearly separate measurement, and collect authenticated report usefulness/implementation feedback. This release does not establish that readiness-score increases cause more AI referrals.
