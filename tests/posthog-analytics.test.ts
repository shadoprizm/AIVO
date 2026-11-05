// PostHog website analytics guardrails (team standard posthog-standard.md v3.1, §5).
// Runs with vitest (`npm test`); assertions use node:assert.
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { CaptureResult } from 'posthog-js';
import {
  CLICK_EVENTS,
  PUBLIC_PATHS,
  SDK_QUERY_PROPERTIES,
  UTM_KEYS,
  analyticsEnabled,
  beforeSend,
  clickEvent,
  isTrackedPath,
  posthogConfig,
  sanitizeUrl,
} from '../src/lib/posthogAnalytics';
import { INDEXABLE_STATIC_ROUTES } from '../scripts/seo-routes.js';

const SITE = 'https://aivoinsights.com';
const TOKEN = 'a'.repeat(64);
const event = (name: string, url: string, extra: Record<string, unknown> = {}) =>
  ({ uuid: 'u', event: name, properties: { $current_url: url, ...extra } }) as unknown as CaptureResult;
const send = (e: CaptureResult) => beforeSend(e) as CaptureResult | null;
const props = (e: CaptureResult | null) => (e?.properties ?? {}) as Record<string, unknown>;
const read = (f: string) => readFileSync(f, 'utf8');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx|js|jsx)$/.test(name) ? [path] : [];
  });
}
const SOURCES = sourceFiles('src');
const ALL_SOURCE = SOURCES.map(read).join('\n');

describe('loading and configuration', () => {
  it('loads nothing unless both the key and a PostHog cloud host are set', () => {
    assert.equal(analyticsEnabled({}), false);
    assert.equal(analyticsEnabled({ key: 'dummy' }), false);
    assert.equal(analyticsEnabled({ host: 'https://us.i.posthog.com' }), false);
    assert.equal(analyticsEnabled({ key: 'dummy', host: 'https://evil.example.com' }), false);
    assert.equal(analyticsEnabled({ key: 'dummy', host: 'https://us.i.posthog.com.evil.com' }), false);
    assert.equal(analyticsEnabled({ key: 'dummy', host: 'http://us.i.posthog.com' }), false);
    assert.equal(analyticsEnabled({ key: 'dummy', host: 'https://us.i.posthog.com' }), true);
    assert.equal(analyticsEnabled({ key: 'dummy', host: 'https://eu.i.posthog.com' }), true);
  });

  it('uses the standard config: memory persistence, no autocapture, pageleave, replay, surveys, flags or remote scripts', () => {
    const { before_send, ...rest } = posthogConfig('https://us.i.posthog.com');
    assert.equal(before_send, beforeSend);
    assert.deepEqual(rest, {
      api_host: 'https://us.i.posthog.com',
      persistence: 'memory',
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: 'history_change',
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      rageclick: false,
      capture_exceptions: false,
      capture_performance: false,
    });
  });

  it('reads only the VITE_PUBLIC_POSTHOG_* env vars and pins posthog-js exactly', () => {
    const component = read('src/components/PostHogAnalytics.tsx');
    assert.match(component, /import\.meta\.env\.VITE_PUBLIC_POSTHOG_KEY/);
    assert.match(component, /import\.meta\.env\.VITE_PUBLIC_POSTHOG_HOST/);
    assert.deepEqual(component.match(/import\.meta\.env\.\w+/g)?.sort(), [
      'import.meta.env.VITE_PUBLIC_POSTHOG_HOST',
      'import.meta.env.VITE_PUBLIC_POSTHOG_KEY',
    ]);
    assert.equal(JSON.parse(read('package.json')).dependencies['posthog-js'], '1.445.6');
  });

  it('has no project token and no identify() call in source, and .env.example leaves the key empty', () => {
    for (const f of [...SOURCES, '.env.example', 'index.html', 'vercel.json']) {
      assert.doesNotMatch(read(f), /phc_[A-Za-z0-9]{20,}/, f);
    }
    assert.doesNotMatch(ALL_SOURCE, /\.identify\(/);
    assert.match(read('.env.example'), /^VITE_PUBLIC_POSTHOG_KEY=$/m);
  });

  it('leaves the GA4 helper separate (PostHog code lives in its own files)', () => {
    assert.doesNotMatch(read('src/lib/analytics.ts'), /posthog/i);
    assert.doesNotMatch(read('src/lib/posthogAnalytics.ts'), /gtag|googletagmanager/);
  });
});

describe('explicit public-route allowlist', () => {
  for (const path of [...PUBLIC_PATHS, '/blog/how-to-rank-in-chatgpt', '/faq/', '/blog/']) {
    it(`tracks ${path}`, () => {
      assert.equal(isTrackedPath(path), true);
      assert.notEqual(send(event('$pageview', `${SITE}${path}`)), null);
    });
  }

  const rejected = [
    '/account', '/login', '/sign-in', '/app', '/billing', '/payment', '/checkout', '/admin', '/reset-password',
    '/signup', '/sign-up', '/dashboard', '/sites/123e4567-e89b-12d3-a456-426614174000', '/admin/blog',
    `/report/${TOKEN}`, '/report', '/auth/callback', '/api/x', '/login/', '/LOGIN', '/unknown-page',
    '/blog/Some Post', '/blog/a/b', '/blog/user@example.com', `/blog/${'a'.repeat(140)}`, '/faq/extra',
  ];
  for (const path of rejected) {
    it(`rejects ${path}`, () => {
      assert.equal(isTrackedPath(path), false);
      assert.equal(send(event('$pageview', `${SITE}${path}`)), null);
      assert.equal(send(event('signup_click', `${SITE}${path}`)), null);
    });
  }

  it('every route in src/App.tsx is either on the allowlist or rejected, so a new route is untracked by default', () => {
    const app = read('src/App.tsx');
    const routes = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(routes.length >= 20);
    for (const route of routes) {
      const sample = route.replace(':slug', 'a-post').replace(':token', TOKEN).replace(':siteId', '42');
      const expected = (PUBLIC_PATHS as readonly string[]).includes(route) || route === '/blog/:slug';
      assert.equal(isTrackedPath(sample), expected, route);
    }
  });

  it('every allowlisted page is a real route that loads the script (component mounted for all routes)', () => {
    const app = read('src/App.tsx');
    for (const path of PUBLIC_PATHS) assert.match(app, new RegExp(`<Route path="${path}" `), path);
    assert.match(app, /<Route path="\/blog\/:slug" /);
    assert.match(app, /import PostHogAnalytics from '\.\/components\/PostHogAnalytics';/);
    // Mounted once inside <Router> but outside <Routes>, so it runs on every page.
    const router = app.indexOf('<Router>');
    const mount = app.indexOf('<PostHogAnalytics />');
    const routesStart = app.indexOf('<Routes>');
    assert.ok(router >= 0 && router < mount && mount < routesStart);
    const indexable = INDEXABLE_STATIC_ROUTES.map((r: { path: string }) => r.path);
    for (const path of PUBLIC_PATHS) assert.ok(indexable.includes(path), `${path} is an indexable public route`);
  });
});

describe('event-name allowlist', () => {
  it('rejects $identify, $autocapture, $pageleave, scroll/engagement and unknown events', () => {
    for (const name of ['$identify', '$autocapture', '$pageleave', '$rageclick', '$dead_click', '$web_vitals',
      '$exception', 'scroll_depth', 'landing_view', 'public_scan_started', 'unknown']) {
      assert.equal(send(event(name, `${SITE}/`)), null, name);
    }
  });

  it('allows only $pageview and the named clicks', () => {
    for (const name of ['$pageview', ...CLICK_EVENTS]) assert.notEqual(send(event(name, `${SITE}/`)), null, name);
    assert.deepEqual([...CLICK_EVENTS].sort(), ['free_scan_click', 'signup_click']);
  });

  it('drops events without a parsable URL', () => {
    assert.equal(send({ uuid: 'u', event: '$pageview', properties: {} } as unknown as CaptureResult), null);
    assert.equal(send(event('$pageview', 'not a url')), null);
    assert.equal(send(null as unknown as CaptureResult), null);
  });
});

describe('URL values keep only short plain standard utm labels', () => {
  it('drops utm_source=a%40b.c, key-like values, spaces, 65-char values and utm_x; keeps utm_campaign=launch-2026', () => {
    assert.equal(sanitizeUrl(`${SITE}/?utm_source=a%40b.c`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_content=sk_live_abc123`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_term=token_abc`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_term=two%20words`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_medium=${'a'.repeat(65)}`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_x=hello`), `${SITE}/`);
    assert.equal(sanitizeUrl(`${SITE}/?utm_campaign=launch-2026`), `${SITE}/?utm_campaign=launch-2026`);
    assert.equal(sanitizeUrl(`${SITE}/faq?utm_source=test&email=a%40b.c#frag`), `${SITE}/faq?utm_source=test`);
  });

  it('cleans $current_url, $referrer and $session_entry_url', () => {
    const out = props(send(event('$pageview', `${SITE}/?utm_source=test&email=a%40b.c#x`, {
      $referrer: 'https://www.google.com/search?q=private+thing&utm_source=a%40b.c',
      $session_entry_url: `${SITE}/faq?code=SECRET123&utm_campaign=launch-2026`,
    })));
    assert.equal(out.$current_url, `${SITE}/?utm_source=test`);
    assert.equal(out.$referrer, 'https://www.google.com/search');
    assert.equal(out.$session_entry_url, `${SITE}/faq?utm_campaign=launch-2026`);
  });

  it('filters the campaign properties the SDK copies out of the address (utm_*, click IDs)', () => {
    const out = props(send(event('$pageview', `${SITE}/`, {
      utm_source: 'a@b.c', utm_campaign: 'launch-2026', utm_content: 'sk_live_abc123', utm_x: 'hello',
      utm_term: 'two words', gclid: 'abc', fbclid: 'abc', gad_source: '1', mc_cid: 'x',
      $session_entry_utm_source: 'newsletter', $session_entry_utm_medium: 'a@b.c', $session_entry_gclid: 'abc',
      $initial_utm_term: 'two words', ph_keyword: 'secret search', $session_entry_ph_keyword: 'secret search',
      $search_engine: 'google', $browser: 'Chrome',
    })));
    assert.equal(out.$search_engine, 'google');
    assert.equal(out.$browser, 'Chrome');
    assert.doesNotMatch(JSON.stringify(out), /a@b|sk_live|two words|secret search/);
    assert.equal(out.utm_campaign, 'launch-2026');
    assert.equal(out.$session_entry_utm_source, 'newsletter');
    for (const key of ['utm_source', 'utm_content', 'utm_x', 'utm_term', 'gclid', 'fbclid', 'gad_source', 'mc_cid',
      '$session_entry_utm_medium', '$session_entry_gclid', '$initial_utm_term', 'ph_keyword', '$session_entry_ph_keyword']) {
      assert.equal(key in out, false, key);
    }
  });

  it('the URL-derived property list covers every campaign parameter of the installed posthog-js', () => {
    const sdk = read('node_modules/@posthog/browser-common/dist/utils/event-utils.mjs');
    const list = (name: string) =>
      [...(sdk.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`))?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const sdkParams = [...list('PERSONAL_DATA_CAMPAIGN_PARAMS'), ...list('CAMPAIGN_PARAMS')];
    assert.ok(sdkParams.includes('gclid') && sdkParams.includes('utm_source'), 'SDK list parsed');
    for (const name of sdkParams) assert.ok(UTM_KEYS.has(name) || SDK_QUERY_PROPERTIES.has(name), `${name} is filtered`);
    assert.match(sdk, /ret\['ph_keyword'\] = keyword/);
    assert.equal(JSON.parse(read('node_modules/posthog-js/package.json')).version, '1.445.6');
  });

  it('removes person properties', () => {
    const out = props(send(event('$pageview', `${SITE}/`, { $set: { email: 'a@b.c' }, $set_once: { x: 1 } })));
    assert.equal('$set' in out, false);
    assert.equal('$set_once' in out, false);
  });
});

describe('single-page-app leaks: private paths and titles from earlier routes', () => {
  it('removes own-site URLs and pathnames of private routes (report tokens, dashboard), keeps public ones', () => {
    const out = props(send(event('$pageview', `${SITE}/`, {
      $pathname: '/',
      $prev_pageview_pathname: `/report/${TOKEN}`,
      $prev_pageview_duration: 12,
      $prev_pageview_max_scroll_percentage: 0.9,
      $session_entry_url: `${SITE}/report/${TOKEN}`,
      $session_entry_pathname: `/report/${TOKEN}`,
      $referrer: `https://www.aivoinsights.com/dashboard?code=SECRET123`,
      $initial_referrer: `${SITE}/sites/42`,
      $session_entry_referrer: 'https://news.ycombinator.com/item?id=1',
      title: 'Scan report for customer-site.example',
    })));
    assert.equal(out.$pathname, '/');
    assert.equal(out.$session_entry_referrer, 'https://news.ycombinator.com/item');
    for (const key of ['$prev_pageview_pathname', '$prev_pageview_duration', '$prev_pageview_max_scroll_percentage',
      '$session_entry_url', '$session_entry_pathname', '$referrer', '$initial_referrer', 'title']) {
      assert.equal(key in out, false, key);
    }
    assert.doesNotMatch(JSON.stringify(out), new RegExp(`${TOKEN}|SECRET123|customer-site`));
  });
});

describe('free checker tools: the website address a visitor types is never sent', () => {
  const CHECKERS = ['/', '/free-ai-visibility-checker', '/chatgpt-seo-checker', '/ai-citation-checker', '/llms-txt-checker',
    '/ai-crawler-robots-txt-checker', '/geo-audit-checklist', '/sample-audits'];

  for (const path of CHECKERS) {
    it(`${path}: a URL or domain in the query string or hash is stripped before sending`, () => {
      const out = send(event('free_scan_click', `${SITE}${path}?url=https%3A%2F%2Fcustomer-site.example%2Fpage&domain=customer-site.example#customer-site.example`, {
        location: 'scan-form',
        $referrer: `${SITE}${path}?site=customer-site.example`,
      }));
      assert.notEqual(out, null);
      assert.equal(props(out).$current_url, `${SITE}${path}`);
      assert.doesNotMatch(JSON.stringify(out), /customer-site/);
    });
  }

  it('the scan click sends only its data-* labels, even if other values are present on the element', () => {
    assert.deepEqual(
      clickEvent({ event: 'free_scan_click', location: 'scan-form', value: 'customer-site.example', url: 'https://customer-site.example' }),
      ['free_scan_click', { location: 'scan-form' }],
    );
  });

  it('the scan button carries only static labels, the click listener never reads form values, autocapture is off', () => {
    const form = read('src/components/scan/PublicScanForm.tsx');
    const button = form.match(/<Button type="submit"[^>]*>/)?.[0] ?? '';
    assert.match(button, /data-event="free_scan_click"/);
    assert.match(button, /data-location="scan-form"/);
    assert.doesNotMatch(button, /data-[a-z-]+=\{/);
    const component = read('src/components/PostHogAnalytics.tsx');
    assert.doesNotMatch(component, /\.value\b|FormData|querySelector|textContent|innerText|href|\$pageleave|scroll/);
    assert.equal(posthogConfig('https://us.i.posthog.com').autocapture, false);
  });

  it('after a scan, the report page (/report/<token>) sends nothing', () => {
    assert.equal(send(event('$pageview', `${SITE}/report/${TOKEN}`)), null);
    assert.equal(send(event('free_scan_click', `${SITE}/report/${TOKEN}`)), null);
  });
});

describe('click events', () => {
  it('send only the allowed event names and at most four truncated data-* labels', () => {
    assert.deepEqual(clickEvent({ event: 'signup_click', location: 'header', extra: 'x' }), ['signup_click', { location: 'header' }]);
    assert.deepEqual(clickEvent({ event: 'signup_click', plan: 'p', platform: 'w', target: 't', location: 'l', other: 'o' }),
      ['signup_click', { plan: 'p', platform: 'w', target: 't', location: 'l' }]);
    assert.equal(clickEvent({ event: 'signup_click', location: 'x'.repeat(80) })?.[1].location.length, 40);
    assert.equal(clickEvent({ event: 'delete_account' }), null);
    assert.equal(clickEvent({}), null);
  });

  it('every data-event hook in src is allowlisted, and every allowlisted click has a hook on a public page', () => {
    const hooks = new Set([...ALL_SOURCE.matchAll(/data-event="([^"]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...hooks].sort(), [...CLICK_EVENTS].sort());
    for (const f of ['src/components/shared/Header.tsx', 'src/components/hero/HeroSection.tsx', 'src/pages/Home.tsx', 'src/pages/HowItWorks.tsx']) {
      assert.match(read(f), /<Link to="\/signup" data-event="signup_click" data-location="[a-z-]+">/, f);
    }
  });
});

describe('the privacy policy discloses exactly what the code does', () => {
  const privacy = read('src/pages/PrivacyPolicy.tsx');

  it('names PostHog, the measured page views and clicks, the US region and IP processing', () => {
    assert.match(privacy, />Website analytics</);
    assert.match(privacy, /This website uses PostHog, a product analytics service, to understand how the site is used\./);
    assert.match(privacy, /It measures page views and clicks on the sign-up links and on the &quot;Run free AI visibility scan&quot; button\./);
    assert.match(privacy, /Analytics data is processed in the US\./);
    assert.match(privacy, /IP addresses may be processed by PostHog\./);
    assert.match(privacy, /They are not sent from the sign-in, sign-up, dashboard, site detail, admin or scan report pages\./);
    assert.match(privacy, /the website address you type into a free checker is not part of these analytics events/);
    assert.match(privacy, /keep only standard campaign tags \(utm_ parameters\) that are short plain labels/);
    assert.match(privacy, /<strong>PostHog:<\/strong>/);
    assert.match(privacy, /Last Updated: November 4, 2026/);
  });

  it('the button text it names exists in the code', () => {
    assert.match(read('src/components/scan/PublicScanForm.tsx'), /'Run free AI visibility scan'/);
  });

  it('makes no IP, cookie, storage, retention or absolute no-tracking claim', () => {
    assert.doesNotMatch(privacy, /IP[^.<]*(anonymi[sz]ed|not (stored|kept|collected))|(not|never) (store|keep|collect)[^.<]*IP/i);
    assert.doesNotMatch(privacy, /no cookies|without cookies|no (local|persistent)? ?storage|storage access/i);
    assert.doesNotMatch(privacy, /tracking cookies|do not track|no tracking|no analytics/i);
    assert.doesNotMatch(privacy, /kept for \d+|retained for \d+/i);
    assert.doesNotMatch(privacy, /never (include|contain)s?/i);
  });
});
