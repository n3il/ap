/**
 * LLM-related type definitions
 */

export type PromptType = 'POSITION_REVIEW' | 'MARKET_SCAN';

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'deepseek';

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

export type LLMTradeAction =
  | {
      type: 'OPEN';
      asset: string;
      direction: 'LONG' | 'SHORT';
      leverage: number;
      trade_amount: number;
      limit_price?: number;
      target_price?: number;
      stop_loss?: number;
      reason: string;
      confidenceScore: number;
    }
  | {
      type: 'CLOSE';
      position_id: string;
      asset: string;
      exit_limit_price?: number;
      reason: string;
      confidenceScore: number;
    };

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
