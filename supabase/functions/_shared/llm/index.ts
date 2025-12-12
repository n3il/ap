/**
 * LLM Module - Unified access to language models via OpenRouter
 *
 * This module provides a clean interface for calling various LLM providers
 * through OpenRouter's unified API.
 */

export { callLLMProvider, tryParseText } from './providers.ts';
export { callOpenRouterAPI } from './openrouter.ts';
export { buildPrompt } from './prompt.ts';
export type {
  PromptType,
  LLMProvider,
  LLMHeadlineBlock,
  LLMOverviewBlock,
  LLMTradeAction,
  ParsedLLMResponse,
  LLMPrompt,
  LLMResponse,
  PromptContext,
} from './types.ts';
export type { PromptTemplateInput } from './prompt.ts';
