// Canonical production values are intentionally defined here as the single frontend source of truth.
export const SITE = {
  name: 'AIVO Insights',
  shortName: 'AIVO',
  domain: 'aivoinsights.com',
  url: import.meta.env.VITE_SITE_URL || 'https://aivoinsights.com',
  description: 'Free AI visibility scanner for websites.',
  supportEmail: 'contact@aivoinsights.com',
};
