import { callGeminiAPI } from './gemini.ts';
import { callDeepseekAPI } from './deepseek.ts';
import { callOpenAIAPI } from './openai.ts';
import { callAnthropicAPI } from './anthropic.ts';
import type { LLMPrompt, LLMResponse, LLMProvider, ParsedLLMResponse } from './types.ts';
import JSON5 from 'npm:json5@2.2.3';

/**
 * Routes LLM call to the appropriate provider
 * Supports Google (Gemini), OpenAI, Anthropic, and Deepseek
 */
export async function callLLMProvider(
  provider: string,
  prompt: LLMPrompt,
  modelName?: string
): Promise<LLMResponse> {
  const normalizedProvider = provider.toLowerCase() as LLMProvider;

  switch (normalizedProvider) {
    case 'deepseek':
      return await callDeepseekAPI(prompt, modelName);

    case 'openai':
      return await callOpenAIAPI(prompt, modelName);

    case 'anthropic':
      return await callAnthropicAPI(prompt, modelName);

    case 'google':
    default:
      return await callGeminiAPI(prompt, modelName);
  }
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
