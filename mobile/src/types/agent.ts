export type AssessmentTradeAction =
  | {
      type: "OPEN";
      asset: string;
      direction: "LONG" | "SHORT";
      leverage?: number;
      trade_amount?: number;
      limit_price?: number;
      target_price?: number;
      stop_loss?: number;
      reason?: string;
      confidenceScore?: number;
    }
  | {
      type: "CLOSE";
      position_id: string;
      asset: string;
      exit_limit_price?: number;
      reason?: string;
      confidenceScore?: number;
    };

export interface AssessmentHeadline {
  short_summary?: string;
  extended_summary?: string;
  thesis?: string;
  sentiment_word?: string;
  sentiment_score?: number;
}

export interface AssessmentOverview {
  macro?: string;
  market_structure?: string;
  technical_analysis?: string;
  [key: string]: string | undefined;
}

export interface AssessmentType {
  headline?: AssessmentHeadline | null;
  overview?: AssessmentOverview | null;
  tradeActions?: AssessmentTradeAction[];
  [key: string]: unknown;
}

export interface AssessmentRecordType {
  agent_id: string;
  llm_prompt_used: string;
  llm_response_text: string;
  parsed_llm_response: AssessmentType | null;
  status: "in_progress" | "completed" | "errored";
}

export interface TradingAccountType {
  id: string;
  label: string;
  type: "paper" | "real";
  hyperliquid_address?: string | null;
  hyperliquid_wallet_address?: string | null;
}

export interface AgentType {
  created_at: string;
  id: string;
  initial_capital: number;
  is_active: boolean | string; // adjust based on actual meaning
  latest_assessment: AssessmentRecordType;
  parsed_llm_response: AssessmentType | null; // refine if known
  timestamp: string;
  trade_action_taken: string;
  llm_provider: string;
  model_name: string;
  name: string;
  published_at: string;
  simulate: boolean;
  user_id: string;
  photo?: string | null;
  trading_accounts?: TradingAccountType[];
}
