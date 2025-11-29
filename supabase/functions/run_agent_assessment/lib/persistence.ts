import { createSupabaseServiceClient } from '../../_shared/supabase.ts';
import type { MarketDataSnapshot } from '../../_shared/lib/types.ts';
import type { LLMResponse, LLMTradeAction } from '../../_shared/llm/types.ts';
import type { PnLMetrics } from '../../_shared/lib/pnl.ts';
import { sanitizeNumericValue } from '../../_shared/lib/numeric.ts';

export interface Assessment {
  id: string;
  agent_id: string;
  timestamp: string;
  market_data_snapshot: MarketDataSnapshot;
  llm_prompt_used: string;
  llm_response_text: string;
  parsed_llm_response: Record<string, unknown> | null;
  trade_action_taken: string;
}

/**
 * Saves an assessment to the database
 */
export async function saveAssessment(
  agentId: string,
  prompt: { systemInstruction: string; userQuery: string },
  llmResponse: LLMResponse,
): Promise<Assessment> {
  const serviceClient = createSupabaseServiceClient();
  const { data: assessment, error } = await serviceClient
    .from('assessments')
    .insert([{
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      llm_prompt_used: `${prompt.systemInstruction}\n\n${prompt.userQuery}`,
      llm_response_text: llmResponse.text,
      parsed_llm_response: llmResponse.parsed ?? null,
    }])
    .select()
    .single();

  if (error) throw error;
  return assessment;
}

/**
 * Saves a PnL snapshot to the database
 */
export async function savePnLSnapshot(
  agentId: string,
  pnlMetrics: PnLMetrics,
  openPositionsCount: number,
  assessmentId: string
): Promise<void> {
  const serviceClient = createSupabaseServiceClient();
  const equity = sanitizeNumericValue(pnlMetrics.accountValue, {
    precision: 18,
    scale: 8,
    allowNegative: true,
    label: 'pnl_equity',
  });
  const realized = sanitizeNumericValue(pnlMetrics.realizedPnl, {
    precision: 18,
    scale: 8,
    allowNegative: true,
    label: 'pnl_realized',
  });
  const unrealized = sanitizeNumericValue(pnlMetrics.unrealizedPnl, {
    precision: 18,
    scale: 8,
    allowNegative: true,
    label: 'pnl_unrealized',
  });
  const marginUsed = sanitizeNumericValue(pnlMetrics.marginUsed, {
    precision: 18,
    scale: 8,
    allowNegative: false,
    label: 'pnl_margin_used',
  });

  const { error } = await serviceClient
    .from('agent_pnl_snapshots')
    .insert([{
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      equity,
      realized_pnl: realized,
      unrealized_pnl: unrealized,
      open_positions_count: openPositionsCount,
      margin_used: marginUsed,
      assessment_id: assessmentId,
    }]);

  if (error) {
    console.error('PnL snapshot save error:', error);
    throw error;
  }

  console.log('PnL snapshot saved:', {
    equity: pnlMetrics.accountValue,
    realizedPnl: pnlMetrics.realizedPnl,
    unrealizedPnl: pnlMetrics.unrealizedPnl,
    marginUsed: pnlMetrics.marginUsed,
  });
}
