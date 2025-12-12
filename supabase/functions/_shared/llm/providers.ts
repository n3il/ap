import { callOpenRouterAPI } from './openrouter.ts';
import type { LLMPrompt, LLMResponse, ParsedLLMResponse } from './types.ts';
import JSON5 from 'npm:json5@2.2.3';

/**
 * Calls LLM provider via OpenRouter unified API
 * OpenRouter provides access to all major LLM providers through a single endpoint
 */
export async function callLLMProvider(
  _provider: string,
  prompt: LLMPrompt,
  modelName?: string
): Promise<LLMResponse> {
  // All providers are now routed through OpenRouter
  // The provider parameter is kept for backward compatibility but not used
  return await callOpenRouterAPI(prompt, modelName);
}

export function tryParseText(text: string): ParsedLLMResponse | null {
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/```(?:json5?|javascript)?\s*(\{[\s\S]*\})\s*```/);
  const inlineJsonMatch = trimmed.match(/\{[\s\S]*\}/);

  const candidate = codeBlockMatch?.[1]
    ?? (trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed : null)
    ?? inlineJsonMatch?.[0]

  if (!candidate) {
    return null;
  }

  return JSON5.parse(candidate);
}
