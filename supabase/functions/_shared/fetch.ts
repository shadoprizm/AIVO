// SECURITY: keep the bot identity explicit for site owners and avoid browser-like spoofing.
const USER_AGENT = 'AIVO-Insights-Bot/1.0 (+https://aivoinsights.com/bot)';

async function readLimitedBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer).slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;

      const remaining = maxBytes - total;
      const nextChunk = value.length > remaining ? value.slice(0, remaining) : value;
      chunks.push(nextChunk);
      total += nextChunk.length;

      if (value.length > remaining) break;
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }

  return body;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number,
  maxBytes: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(options.headers);
    headers.set('User-Agent', USER_AGENT);

    const response = await fetch(url, {
      ...options,
      redirect: options.redirect ?? 'follow',
      signal: controller.signal,
      headers,
    });

    const limitedBody = await readLimitedBody(response, maxBytes);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('x-aivo-bytes-read', String(limitedBody.length));

    return new Response(limitedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
