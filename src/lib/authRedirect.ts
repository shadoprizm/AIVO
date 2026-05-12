export const POST_AUTH_REDIRECT_KEY = 'aivo-post-auth-redirect';

const DEFAULT_AUTH_REDIRECT = '/dashboard';
const AUTH_ENTRY_PATHS = new Set(['/login', '/signup']);

function getStoredRedirect(): string | null {
  try {
    return sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    return null;
  }
}

export function clearPostAuthRedirect() {
  try {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    // Session storage may be unavailable in restrictive browser modes.
  }
}

export function normalizeAuthRedirectPath(value: string | null | undefined): string {
  const rawValue = value?.trim();
  if (!rawValue) return DEFAULT_AUTH_REDIRECT;

  try {
    const redirectUrl = new URL(rawValue, window.location.origin);
    if (redirectUrl.origin !== window.location.origin || AUTH_ENTRY_PATHS.has(redirectUrl.pathname)) {
      return DEFAULT_AUTH_REDIRECT;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function getAuthRedirectPath(search = window.location.search): string {
  const queryRedirect = new URLSearchParams(search).get('redirect');
  return normalizeAuthRedirectPath(queryRedirect || getStoredRedirect());
}

export function getPostAuthRedirectUrl(): string {
  return `${window.location.origin}${getAuthRedirectPath()}`;
}

export function rememberPostAuthRedirect(path: string): string {
  const redirectPath = normalizeAuthRedirectPath(path);

  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectPath);
  } catch {
    // The login page also receives the redirect as a query parameter.
  }

  return redirectPath;
}
