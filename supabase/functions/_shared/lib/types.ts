/**
 * Shared type definitions used across edge functions
 */

export interface Agent {
  id: string;
  name: string;
  user_id: string;
  is_active: boolean | string;
  initial_capital: string | number;
  llm_provider?: string;
  model_name?: string;
  hyperliquid_address?: string;
  market_prompt_id?: string | null;
  position_prompt_id?: string | null;
}

export interface Trade {
  id: string;
  agent_id: string;
  asset: string;
  side: 'LONG' | 'SHORT';
  size: string | number;
  entry_price: string | number;
  exit_price?: string | number;
  leverage: string | number;
  status: 'OPEN' | 'CLOSED';
  entry_timestamp: string;
  exit_timestamp?: string;
  realized_pnl?: string | number;
}

export interface MarketAsset {
  symbol: string;
  price: number;
  [key: string]: any;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  agent_id: string;
  label: string;
  type: 'paper' | 'real';
}

export interface HyperliquidTradeResult {
  success: boolean;
  error?: string;
  price?: number;
  fee?: number;
  orderId?: string;
  message?: string;
}
