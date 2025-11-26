export interface AssessmentTradeAction {
  asset: string;
  action: "CLOSE_SHORT" | "CLOSE_LONG" | "OPEN_SHORT" | "OPEN_LONG" | string;
  leverage: number;
  size: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidenceScore: number;
  reasoning: string;
}

export interface AssessmentHeadline {
  short_summary: string;
  extended_summary: string;
  thesis: string;
  sentiment_word: string;
  sentiment_score: number;
}

export interface AssessmentOverview {
  macro: string;
  market_structure: string;
  technical_analysis: string;
}

export interface AssessmentType {
  headline: AssessmentHeadline;
  overview: AssessmentOverview;
  tradeActions: AssessmentTradeAction[];
}

export interface AssessmentRecordType {
  agent_id: string;
  llm_prompt_used: string;
  llm_response_text: string;
  parsed_llm_response: any;
}

export interface AgentType {
  created_at: string;
  hyperliquid_address: string;
  id: string;
  initial_capital: number;
  is_active: boolean | string; // adjust based on actual meaning
  latest_assessment: AssessmentRecordType;
  market_data_snapshot: any; // refine if known
  parsed_llm_response: any; // refine if known
  prompt_id: string | null;
  timestamp: string;
  trade_action_taken: string;
  llm_provider: string;
  model_name: string;
  name: string;
  published_at: string;
  simulate: boolean;
  user_id: string;
}
