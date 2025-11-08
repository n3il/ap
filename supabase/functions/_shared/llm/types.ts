/**
 * LLM-related type definitions
 */

export type PromptType = 'POSITION_REVIEW' | 'MARKET_SCAN';

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'deepseek';

export interface LLMPrompt {
  systemInstruction: string;
  userQuery: string;
}

export interface LLMResponse {
  text: string;
  action: string;
}

export interface PromptContext {
  promptType: PromptType;
  marketData: any[];
  openPositions: any[];
  accountValue: number;
  remainingCash: number;
  candleData: Record<string, any>;
}
