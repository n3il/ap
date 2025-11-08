import { createSupabaseServiceClient } from '../../_shared/supabase.ts';
import type { MarketDataSnapshot } from './data.ts';
import type { PromptType, LLMResponse } from '../../_shared/llm/types.ts';
import type { PnLMetrics } from '../../_shared/lib/pnl.ts';

export interface Assessment {
  id: string;
  agent_id: string;
  timestamp: string;
  type: PromptType;
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
  promptType: PromptType,
  marketSnapshot: MarketDataSnapshot,
  prompt: { systemInstruction: string; userQuery: string },
  llmResponse: LLMResponse
): Promise<Assessment> {
  const serviceClient = createSupabaseServiceClient();

  const { data: assessment, error } = await serviceClient
    .from('assessments')
    .insert([{
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      type: promptType,
      market_data_snapshot: marketSnapshot,
      llm_prompt_used: `${prompt.systemInstruction}\n\n${prompt.userQuery}`,
      llm_response_text: llmResponse.text,
      parsed_llm_response: llmResponse.parsed ?? null,
      trade_action_taken: llmResponse.action,
    }])
    .select()
    .single();

  if (error) throw error;

  console.log('Assessment saved:', assessment.id);
  return assessment as Assessment;
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

  const { error } = await serviceClient
    .from('agent_pnl_snapshots')
    .insert([{
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      equity: pnlMetrics.accountValue,
      realized_pnl: pnlMetrics.realizedPnl,
      unrealized_pnl: pnlMetrics.unrealizedPnl,
      open_positions_count: openPositionsCount,
      margin_used: pnlMetrics.marginUsed,
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
