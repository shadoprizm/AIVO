# AIVO Free-First Relaunch QA Matrix

Use this matrix for local, preview, and production verification. Mark each item with the environment, date, tester, and notes before release approval.

## Public Scan

- [ ] Homepage public scan with a valid public URL returns a report.
- [ ] Invalid URL is rejected gracefully with a specific error.
- [ ] Localhost URLs are blocked.
- [ ] Private IPv4 ranges are blocked.
- [ ] Private IPv6 loopback is blocked.
- [ ] Public report loads in an incognito or signed-out browser.
- [ ] DeepSeek timeout returns deterministic partial scores and the partial-status message.

## Report UX

- [ ] Copy report link works.
- [ ] Copy developer checklist works.
- [ ] Copy content brief works.
- [ ] Print or save-to-PDF action opens browser print.
- [ ] Download JSON evidence works.
- [ ] Feedback form submits usefulness feedback anonymously.
- [ ] Mobile layout is readable for homepage, public scan form, and public report.

## Authentication And Claiming

- [ ] Google OAuth login redirects to dashboard.
- [ ] GitHub OAuth login redirects to dashboard.
- [ ] Email and password fallback works.
- [ ] Anonymous report claim flow works end to end after login.
- [ ] Claimed report appears in dashboard.
- [ ] Dashboard authenticated scan works.

## Abuse Controls

- [ ] Rate limit enforces 3 scans per IP per day.
- [ ] Rate limit enforces 1 scan per domain per day for anonymous scans.
- [ ] Redirect cap blocks excessive redirects.
- [ ] Fetch timeout stops slow pages without failing the whole scan.
- [ ] Max bytes per page is enforced.
- [ ] Public report tokens are not enumerable.

## Analytics And Site Files

- [ ] Analytics events fire without emails, IP addresses, or exact URLs in payloads.
- [ ] `llms.txt` returns 200.
- [ ] `sitemap.xml` returns 200 and includes GEO landing pages.
- [ ] `robots.txt` returns 200.
- [ ] Route-specific metadata and FAQ schema are present on GEO landing pages.
