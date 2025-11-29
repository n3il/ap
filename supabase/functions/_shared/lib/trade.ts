import { createSupabaseServiceClient } from '../supabase.ts';
import { executeHyperliquidTrade } from '../hyperliquid/index.ts';
import { recordLedgerExecution } from './ledger.ts';
import type { Agent } from './types.ts';
import type { LLMTradeAction } from '../llm/types.ts';
import { toHyperliquidOrder } from "../hyperliquid/mapping.ts";


export async function executeTrade(
  assetId: number,
  tradeAction: LLMTradeAction,
  agent: Agent,
) {
  // const supabase = createSupabaseServiceClient();

  // Execute trade on Hyperliquid (only for real trades)
  const tradeResult = await executeHyperliquidTrade(
    toHyperliquidOrder(assetId, tradeAction),
    agent.simulate,
    agent.hyperliquid_address
  );

  // // Record in ledger (to-do, offload to background job)
  // const ledgerRecords = await recordLedgerExecution({
  //   supabase,
  //   accountId: ledgerAccount.id,
  //   agentId: agent.id,
  //   userId: agent.user_id,
  //   symbol: action.asset,
  //   executionSide: side === 'LONG' ? 'BUY' : 'SELL',
  //   quantity: positionQuantity,
  //   price: entryPrice,
  //   fee: tradeResult.fee ?? 0,
  //   clientOrderId: normalizedOrderId,
  //   realizedPnL: 0,
  //   metadata: {
  //     source: 'execute_hyperliquid_trade',
  //     action: action.type,
  //     asset: action.asset,
  //     hyperliquidOrderId: normalizedOrderId,
  //     message: tradeResult.message,
  //     mode: tradingMode,
  //     leverage,
  //     collateral,
  //     position_id: positionId,
  //     position_side: side,
  //     entry_price: entryPrice,
  //     entry_timestamp: openedAt,
  //     position_quantity: positionQuantity,
  //     stopLoss: action.stop_loss,
  //     targetPrice: action.target_price,
  //     confidenceScore: action.confidenceScore,
  //     reasoning: action.reason,
  //   },
  //   description: `Opened ${side} ${action.asset}`,
  //   type: tradingMode,
  // });

  return tradeResult

}
