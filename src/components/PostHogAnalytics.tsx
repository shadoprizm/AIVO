// Loads PostHog only on public marketing and free-tool pages, and only when VITE_PUBLIC_POSTHOG_KEY and
// VITE_PUBLIC_POSTHOG_HOST are both set at build time. See src/lib/posthogAnalytics.ts for what is (not) sent.
// Independent of the GA4 helper (src/lib/analytics.ts), which is unchanged.
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { PostHog } from 'posthog-js';
import { analyticsEnabled, clickEvent, isTrackedPath, posthogConfig } from '../lib/posthogAnalytics';

const KEY: string | undefined = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const HOST: string | undefined = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

export default function PostHogAnalytics() {
  const { pathname } = useLocation();
  const client = useRef<PostHog | null>(null);
  const tracked = isTrackedPath(pathname);

  // Initialize lazily, the first time a visitor is on a public page. A visitor who lands directly on
  // /login, /signup, /dashboard, /sites, /admin or /report never loads the SDK; events from those
  // pages after a client-side navigation are dropped in beforeSend.
  useEffect(() => {
    if (!tracked || client.current || !analyticsEnabled({ key: KEY, host: HOST })) return;
    let cancelled = false;
    import('posthog-js').then(({ default: posthog }) => {
      if (cancelled || client.current) return;
      posthog.init(KEY!, posthogConfig(HOST!));
      client.current = posthog;
    });
    return () => {
      cancelled = true;
    };
  }, [tracked]);

  // One delegated listener in the capture phase, so the click is recorded on the page where it happened,
  // before react-router changes the URL. Only the allowlisted data-* labels are read.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-event]') : null;
      const captured = el ? clickEvent({ ...el.dataset }) : null;
      if (captured && client.current) client.current.capture(...captured);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
