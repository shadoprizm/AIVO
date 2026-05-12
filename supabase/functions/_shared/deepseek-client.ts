interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface DeepSeekChoice {
  message?: {
    content?: string;
  };
}

interface DeepSeekResponse {
  choices?: DeepSeekChoice[];
}

export interface DeepSeekCallOptions {
  timeoutMs: number;
  temperature?: number;
  maxTokens?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function deepseekModel(): string {
  return Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
}

function apiUrl(): string {
  const base = (Deno.env.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com/v1').replace(/\/$/, '');
  return `${base}/chat/completions`;
}

function apiKey(): string | null {
  return Deno.env.get('DEEPSEEK_API_KEY') ?? null;
}

export async function callDeepSeekJson<T>(messages: ChatMessage[], options: DeepSeekCallOptions): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const { timeoutMs, temperature = 0.1, maxTokens = 4000 } = options;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(apiUrl(), {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: deepseekModel(),
          messages,
          temperature,
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
        }),
      });

      if ((response.status === 429 || response.status === 503) && attempt === 0) {
        await delay(500);
        continue;
      }

      if (!response.ok) return null;

      const payload = await response.json() as DeepSeekResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;

      return JSON.parse(content) as T;
    } catch {
      if (attempt === 0) {
        await delay(500);
        continue;
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}
