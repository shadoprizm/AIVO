export interface PublicScanResult {
  scanId: string;
  publicToken: string;
  reportUrl: string;
  status: 'complete' | 'partial';
  message?: string;
}

interface PublicScanErrorBody {
  error?: string;
}

function getFunctionsBaseUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Scan service is not configured.');
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
}

export async function startPublicScan(url: string): Promise<PublicScanResult> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error('Enter a website URL to scan.');
  }

  let response: Response;
  try {
    response = await fetch(`${getFunctionsBaseUrl()}/public-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: trimmedUrl }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  const body = await response.json().catch((): PublicScanErrorBody => ({}));
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'Unable to start scan. Try again in a minute.';
    throw new Error(message);
  }

  return body as PublicScanResult;
}

export async function fetchPublicReport(token: string): Promise<Record<string, unknown>> {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error('Report not found.');
  }

  let response: Response;
  try {
    response = await fetch(`${getFunctionsBaseUrl()}/public-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  const body = await response.json().catch((): PublicScanErrorBody => ({}));
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'Unable to load report.';
    throw new Error(message);
  }

  return body;
}
