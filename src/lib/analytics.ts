type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
let initialized = false;

function sanitizeProperties(properties: AnalyticsProperties = {}): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes('email') || normalizedKey.includes('ip') || normalizedKey === 'url') {
        return false;
      }
      if (typeof value === 'string' && (value.includes('@') || /^https?:\/\//i.test(value))) {
        return false;
      }
      return true;
    })
  );
}

function initAnalytics(): void {
  if (!measurementId || initialized) return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });
    initialized = true;
  } catch {
    initialized = true;
  }
}

export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  if (!measurementId) return;

  try {
    initAnalytics();
    window.gtag?.('event', eventName, sanitizeProperties(properties));
  } catch {
    // Analytics must never break product flows.
  }
}

export function trackPageView(path: string): void {
  if (!measurementId) return;

  try {
    initAnalytics();
    window.gtag?.('event', 'page_view', {
      page_path: path,
    });
  } catch {
    // Analytics must never break product flows.
  }
}
