import { callGeminiAPI, buildPrompt } from '../../_shared/gemini.ts';
import { callDeepseekAPI } from '../../_shared/deepseek.ts';
import { callOpenAIAPI } from '../../_shared/openai.ts';
import { callAnthropicAPI } from '../../_shared/anthropic.ts';
import { fetchPrompt } from '../../_shared/lib/prompts.ts';
import type { Agent } from './agent.ts';
import type { Trade, MarketAsset } from './data.ts';

export type PromptType = 'POSITION_REVIEW' | 'MARKET_SCAN';

export interface LLMResponse {
  text: string;
  action: string;
}

export interface PromptContext {
  promptType: PromptType;
  marketData: MarketAsset[];
  openPositions: Trade[];
  accountValue: number;
  remainingCash: number;
  candleData: Record<string, any>;
}

/**
 * Determines the prompt type based on open positions
 */
export function determinePromptType(openPositions: Trade[]): PromptType {
  return openPositions.length > 0 ? 'POSITION_REVIEW' : 'MARKET_SCAN';
}

/**
 * Builds the LLM prompt from template and context
 */
export async function buildLLMPrompt(
  serviceClient: any,
  agent: Agent,
  context: PromptContext
): Promise<{ systemInstruction: string; userQuery: string }> {
  const template = await fetchPrompt(serviceClient, agent, context.promptType);

  return buildPrompt(template, context);
}

/**
 * Routes the LLM call to the appropriate provider
 */
export async function callLLMProvider(
  provider: string,
  prompt: { systemInstruction: string; userQuery: string },
  modelName?: string
): Promise<LLMResponse> {
  const normalizedProvider = provider.toLowerCase();

  switch (normalizedProvider) {
    case 'deepseek':
      return await callDeepseekAPI(prompt, modelName);
    case 'openai':
      return await callOpenAIAPI(prompt, modelName);
    case 'anthropic':
      return await callAnthropicAPI(prompt, modelName);
    default:
      return await callGeminiAPI(prompt, modelName);
  }
}

/**
 * Orchestrates the entire LLM interaction flow
 */
export async function generateAssessment(
  serviceClient: any,
  agent: Agent,
  context: PromptContext
): Promise<{ response: LLMResponse; prompt: any }> {
  const prompt = await buildLLMPrompt(serviceClient, agent, context);

  const provider = agent.llm_provider || 'google';
  const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;

  const response = await callLLMProvider(provider, prompt, modelName);

  console.log('LLM response received, action:', response.action);

  return { response, prompt };
}
