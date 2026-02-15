import type { AnthropicResponse } from '@/src/types/agent';
import { AI_MAX_TOKENS, AI_TIMEOUT_MS } from '@/src/core/constants/app-constants';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';


const ERROR_MESSAGES: Record<number, string> = {
  401: 'Invalid API key. Please check your key in Settings.',
  429: 'Rate limited. Please try again in a moment.',
  500: 'Anthropic API is temporarily unavailable.',
  503: 'Anthropic API is temporarily unavailable.',
};

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: AI_MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const message = ERROR_MESSAGES[response.status] ?? `API error (${response.status}). Please try again.`;
    throw new Error(message);
  }

  const data: AnthropicResponse = await response.json();
  const textBlock = data.content.find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}
