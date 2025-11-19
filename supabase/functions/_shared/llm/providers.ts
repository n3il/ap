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
  // First attempt: parse directly with JSON5
  try {
    return JSON5.parse(text);
  } catch (e) {
    // Ignore and try extraction
  }

  // Second attempt: extract from markdown code blocks
  try {
    const codeBlockMatch = text.match(/```(?:json5?|javascript)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      return JSON5.parse(codeBlockMatch[1]);
    }
  } catch (e) {
    // Ignore
  }

  // Third attempt: find first JSON-like object
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON5.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('All JSON5 parsing attempts failed:', e);
  }

  return null;
}