// PostHog website analytics for the public aivoinsights.com marketing and free-tool pages only
// (PostHog project "aivoinsights.com", US). Team standard: posthog-standard.md v3.1.
// Separate from the GA4 helper in ./analytics.ts, which is unchanged.
//
// What is sent: $pageview on the public pages below and the named [data-event] clicks, nothing else.
// What is never read: form values (including the website address typed into a checker), link text,
// hrefs, report tokens, account data. autocapture is off and identify() is never called.
// This module is pure (no import.meta.env, no DOM access) so it can be unit tested with node --test.
import type { BeforeSendFn, CaptureResult, PostHogConfig } from 'posthog-js';

/** Explicit event names allowed from `[data-event]` elements. Anything else is ignored. */
export const CLICK_EVENTS = new Set(['signup_click', 'free_scan_click']);
/** Only these data-* labels are sent with click events (never text, href or form values). */
export const CLICK_PROPERTIES = ['platform', 'target', 'plan', 'location'] as const;
/** Page views only: no $pageleave, scroll or engagement events. */
const AUTOMATIC_EVENTS = new Set(['$pageview']);

/** Explicit public-route allowlist (fixed public marketing and free-tool pages of src/App.tsx). */
export const PUBLIC_PATHS = [
  '/',
  '/how-it-works',
  '/faq',
  '/blog',
  '/privacy',
  '/terms',
  '/sample-audits',
  '/free-ai-visibility-checker',
  '/chatgpt-seo-checker',
  '/ai-citation-checker',
  '/llms-txt-checker',
  '/ai-crawler-robots-txt-checker',
  '/geo-audit-checklist',
] as const;

/** Published blog posts (/blog/:slug) are public; the slug must be a plain lowercase slug. */
const BLOG_POST_PATH = /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BLOG_POST_PATH_LENGTH = 140;

/**
 * Belt and braces on top of the allowlist: the sign-in, sign-up, signed-in, admin and token-report
 * routes of this repo, plus common private route names. None of them is ever tracked; tests assert this.
 */
export const PRIVATE_PATHS = [
  '/login',          // Supabase email/password and OAuth sign-in
  '/signup',         // account creation
  '/dashboard',      // signed-in dashboard (also the OAuth return target)
  '/sites',          // /sites/:siteId, signed-in site detail
  '/admin',          // /admin and /admin/blog, administrators only
  '/report',         // /report/:token, token-addressed scan reports
  '/account',
  '/sign-in',
  '/sign-up',
  '/app',
  '/billing',
  '/payment',
  '/checkout',
  '/reset-password',
  '/auth',
  '/api',
] as const;

export type AnalyticsEnv = { key?: string; host?: string };

/** Both values must be set at build time (VITE_PUBLIC_POSTHOG_KEY, VITE_PUBLIC_POSTHOG_HOST); otherwise nothing loads. */
export function analyticsEnabled({ key, host }: AnalyticsEnv): boolean {
  return Boolean(key && host && /^https:\/\/(us|eu)\.i\.posthog\.com$/.test(host));
}

export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;
}

export function isPrivatePath(pathname: string): boolean {
  const path = normalizePath(pathname).toLowerCase();
  return PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}.`));
}

/** Explicit allowlist: a page is tracked only if it is a fixed public page or a plain blog-post slug. */
export function isTrackedPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (isPrivatePath(path)) return false;
  if ((PUBLIC_PATHS as readonly string[]).includes(path)) return true;
  return path.length <= MAX_BLOG_POST_PATH_LENGTH && BLOG_POST_PATH.test(path);
}

/** The five standard campaign parameters; any other query parameter is dropped. */
export const UTM_KEYS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']);

/**
 * A campaign value is kept only if it is a short, plain label (letters, digits and . _ ~ + -, at most 64 chars)
 * that does not look like a key or token. This drops values such as utm_source=a@b.c, free text and keys.
 */
export function isSafeCampaignValue(value: string): boolean {
  return /^[A-Za-z0-9._~+-]{1,64}$/.test(value) && !/(^|[_-])(sk|pk|rk|phc|ghp|gho|key|token|secret)[_-]/i.test(value);
}

/** Keep only the origin, path and safe standard utm_* parameters of a URL. Other query values and the hash are dropped. */
export function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    const kept = new URLSearchParams();
    url.searchParams.forEach((v, k) => {
      if (UTM_KEYS.has(k) && isSafeCampaignValue(v)) kept.set(k, v);
    });
    url.search = kept.toString();
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Query values posthog-js 1.445.6 also copies out of the page URL or referrer into separate properties
 * (@posthog/browser-common event-utils: CAMPAIGN_PARAMS minus utm_*, and the search-engine keyword `ph_keyword`),
 * each also as `$session_entry_<name>` / `$initial_<name>`. Cleaning URLs alone would not remove them.
 * A test checks this list against the installed SDK, so an upgrade that adds a parameter fails the tests.
 */
export const SDK_QUERY_PROPERTIES = new Set([
  'gad_source', 'mc_cid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'twclid', 'li_fat_id',
  'igshid', 'ttclid', 'rdt_cid', 'epik', 'qclid', 'sccid', 'oppref', 'bfcid', 'irclid', '_kx', 'ph_keyword',
]);

const propertyBase = (key: string) => key.replace(/^\$(session_entry_|initial_)/, '').replace(/^\$/, '');
const siteHost = (hostname: string) => hostname.toLowerCase().replace(/^www\./, '');

/**
 * Cleans every property in place (team standard v3.2, plus single-page-app guards for this site):
 * - utm_* properties keep only safe values of the 5 standard keys; other SDK query properties are removed;
 * - every URL value keeps only safe utm_* parameters and loses its hash; a URL of this site whose path is
 *   not public (e.g. a /report/<token> referrer or session entry) is removed;
 * - every *pathname property whose path is not public is removed;
 * - page titles (stale after a client-side route change) and previous-page properties
 *   ($prev_pageview_pathname, duration, scroll) are removed.
 */
export function sanitizeProperties(props: Record<string, unknown>, ownHostname: string): void {
  const ownHost = siteHost(ownHostname);
  for (const [key, value] of Object.entries(props)) {
    const base = propertyBase(key);
    if (key === 'title' || key.startsWith('$prev_pageview_')) {
      delete props[key];
    } else if (UTM_KEYS.has(base)) {
      if (!(typeof value === 'string' && isSafeCampaignValue(value))) delete props[key];
    } else if (SDK_QUERY_PROPERTIES.has(base) || /^utm_/i.test(base)) {
      delete props[key];
    } else if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      // Every URL-valued property ($current_url, referrers, $session_entry_url, ...), not a fixed list.
      const cleaned = sanitizeUrl(value);
      if (typeof cleaned !== 'string') {
        delete props[key];
        continue;
      }
      const url = new URL(cleaned);
      if (siteHost(url.hostname) === ownHost && !isTrackedPath(url.pathname)) delete props[key];
      else props[key] = cleaned;
    } else if (/pathname$/i.test(key) && typeof value === 'string' && !isTrackedPath(value)) {
      delete props[key];
    }
  }
}

/** Drops events from non-public pages or with unknown names, cleans every property and removes person properties. */
export const beforeSend: BeforeSendFn = (event: CaptureResult | null) => {
  if (!event) return null;
  const props = (event.properties ?? {}) as Record<string, unknown>;
  const current = typeof props.$current_url === 'string' ? props.$current_url : '';
  let currentUrl: URL;
  try {
    currentUrl = new URL(current);
  } catch {
    return null;
  }
  if (!isTrackedPath(currentUrl.pathname)) return null;
  if (!AUTOMATIC_EVENTS.has(event.event) && !CLICK_EVENTS.has(event.event)) return null;
  sanitizeProperties(props, currentUrl.hostname);
  delete props.$set;
  delete props.$set_once;
  event.properties = props as CaptureResult['properties'];
  return event;
};

export function posthogConfig(host: string): Partial<PostHogConfig> {
  return {
    api_host: host,
    persistence: 'memory',              // no cookies, no localStorage
    person_profiles: 'identified_only', // identify() is never called, so no person profiles
    autocapture: false,                 // only the explicit [data-event] clicks; form inputs are never read
    capture_pageview: 'history_change', // client-routed SPA (react-router): one page view per route change
    capture_pageleave: false,           // pageleave off (not in the disclosed scope)
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true, // no recorder, toolbar or other remote scripts
    advanced_disable_flags: true,       // no feature-flag requests
    capture_heatmaps: false,
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_performance: false,
    before_send: beforeSend,
  };
}

/** Builds the capture call for a click on a `[data-event]` element, or null if it is not allowed. */
export function clickEvent(dataset: Record<string, string | undefined>): [string, Record<string, string>] | null {
  const name = dataset.event;
  if (!name || !CLICK_EVENTS.has(name)) return null;
  const props: Record<string, string> = {};
  for (const key of CLICK_PROPERTIES) {
    const value = dataset[key];
    if (value) props[key] = String(value).slice(0, 40);
  }
  return [name, props];
}
