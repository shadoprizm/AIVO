function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  parsed.protocol = 'https:';
  parsed.hash = '';
  parsed.username = '';
  parsed.password = '';

  return parsed.toString();
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0 && !isPrivateIp(parsed.hostname);
  } catch {
    return false;
  }
}

export function isPrivateIp(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');

  if (normalized === 'localhost' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  const ipv4 = parseIpv4(normalized);
  if (!ipv4) return false;

  const [first, second] = ipv4;
  return (
    first === 127 ||
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function capRedirects(response: Response, maxRedirects: number): boolean {
  const redirectCount = Number(response.headers.get('x-aivo-redirect-count') ?? '0');
  if (!Number.isFinite(redirectCount)) return false;
  return redirectCount <= maxRedirects;
}
