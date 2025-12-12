import type { LLMPrompt, LLMResponse } from './types.ts';
import { tryParseText } from './providers.ts';
import { externalFetch } from '../lib/external_request.ts';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * OpenRouter API client - unified access to multiple LLM providers
 * Supports all major models through a single API endpoint
 */
export async function callOpenRouterAPI(
  prompt: LLMPrompt,
  modelName?: string
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable not set');
  }

  // Use the provided model or default to a reliable option
  // Model name should be in OpenRouter format: "provider/model-name" or "provider/model-name:variant"
  // Examples: "google/gemini-2.0-flash-exp:free", "openai/gpt-4o", "anthropic/claude-3.5-sonnet"
  const model = modelName || 'google/gemini-2.0-flash-exp:free';

  const response = await externalFetch(
    API_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_URL') || 'https://localhost',
        'X-Title': 'Trading Agent Platform',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt.systemInstruction },
          { role: 'user', content: prompt.userQuery },
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4096,
      }),
    },
    async (res) => ({
      name: 'openrouter',
      url: API_URL,
      method: 'POST',
      requestBody: { model },
      responseBody: await res.clone().json().catch(() => undefined),
    })
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error response:', errorText);
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('No response from OpenRouter API');
  }

  const parsed = tryParseText(text);

  return {
    text,
    parsed,
    rawResponse: data,
  };
}
