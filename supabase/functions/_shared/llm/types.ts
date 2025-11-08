/**
 * LLM-related type definitions
 */

export type PromptType = 'POSITION_REVIEW' | 'MARKET_SCAN';

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'deepseek';

export type TradeActionType =
  | 'OPEN_LONG'
  | 'OPEN_SHORT'
  | 'CLOSE_LONG'
  | 'CLOSE_SHORT'
  | 'NO_ACTION';

export interface LLMHeadlineBlock {
  short_summary?: string;
  extended_summary?: string;
  thesis?: string;
  sentiment_word?: string;
  sentiment_score?: number;
}

export interface LLMOverviewBlock {
  macro?: string;
  market_structure?: string;
  technical_analysis?: string;
}

export interface LLMTradeAction {
  asset?: string;
  action?: TradeActionType;
  leverage?: number;
  size?: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidenceScore?: number;
  reasoning?: string;
}

export interface ParsedLLMResponse {
  headline?: LLMHeadlineBlock | null;
  overview?: LLMOverviewBlock | null;
  tradeActions?: LLMTradeAction[];
}

export interface LLMPrompt {
  systemInstruction: string;
  userQuery: string;
}

export interface LLMResponse {
  text: string;
  action: string;
  parsed: ParsedLLMResponse | null;
  rawResponse?: unknown;
}

export interface PromptContext {
  promptType: PromptType;
  marketData: any[];
  openPositions: any[];
  accountValue: number;
  remainingCash: number;
  candleData: Record<string, any>;
}
