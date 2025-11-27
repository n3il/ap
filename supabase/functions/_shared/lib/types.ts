/**
 * Shared type definitions used across edge functions
 */

export interface Agent {
  id: string;
  name: string;
  user_id: string;
  is_active: Date | string;
  initial_capital: string | number;
  llm_provider: string;
  model_name: string;
  hyperliquid_address: string;
  prompt_id: string;
  simulate: boolean;
  published_at: string;
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
  type?: 'paper' | 'real';
  account_id?: string;
  user_id?: string;
}

export interface OpenPosition {
    asset: string;
    side: 'LONG' | 'SHORT';
    size: string | number;
    entry_price: string | number;
    leverage: string | number;
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

export interface MarketDataSnapshot {
  timestamp: string;
  market_prices: MarketAsset[];
  open_positions: Trade[];
}
