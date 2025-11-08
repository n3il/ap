import { callGeminiAPI } from '../gemini.ts';
import { callDeepseekAPI } from '../deepseek.ts';
import { callOpenAIAPI } from '../openai.ts';
import { callAnthropicAPI } from '../anthropic.ts';
import type { LLMPrompt, LLMResponse, LLMProvider } from './types.ts';

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

/**
 * Determines prompt type based on open positions
 */
export function determinePromptType(hasOpenPositions: boolean): 'POSITION_REVIEW' | 'MARKET_SCAN' {
  return hasOpenPositions ? 'POSITION_REVIEW' : 'MARKET_SCAN';
}
