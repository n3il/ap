import { executeHyperliquidTrade } from '../hyperliquid/index.ts';
import type { Agent, TradingAccount, } from './types.ts';
import type { LLMTradeAction } from '../llm/types.ts';
import { toHyperliquidOrder, AssetType } from "../hyperliquid/mapping.ts";
import { Position } from "../hyperliquid/types.ts";
import initSentry from "../../_shared/sentry.ts";

const Sentry = initSentry();

export async function executeTrade(
  asset: AssetType,
  tradeAction: LLMTradeAction,
  agent: Agent,
  tradingAccount: TradingAccount,
  position: Position,
) {
  if (!tradingAccount.hyperliquid_wallet_private_key) {
    throw new Error('Trading account is missing Hyperliquid wallet credentials');
  }
  const hyperliquidOrder = await toHyperliquidOrder(asset, tradeAction, position);
  Sentry.addBreadcrumb({
    category: "trade_order",
    level: "info",
    data: {
      asset: JSON.stringify(asset),
      trade_action: JSON.stringify(tradeAction),
      hyperliquid_order: JSON.stringify(hyperliquidOrder),
    }
  });

  let tradeResult;
  try {
    // Execute trade on Hyperliquid (only for real trades)
    tradeResult = await executeHyperliquidTrade(
      hyperliquidOrder,
      agent.simulate,
      tradingAccount.hyperliquid_wallet_private_key,
    );
  } catch (e) {
    Sentry.captureException(e);
  }

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
