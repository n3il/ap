import type { SupabaseClient } from '@supabase/supabase-js'

export type PromptType = 'MARKET_SCAN' | 'POSITION_REVIEW'

export interface PromptRecord {
  id?: string
  user_id?: string | null
  name?: string
  description?: string | null
  prompt_type: PromptType
  system_instruction: string
  user_template: string
  is_default?: boolean
  is_active?: boolean
  updated_at?: string
}

const FALLBACK_PROMPTS: Record<PromptType, PromptRecord> = {
  MARKET_SCAN: {
    prompt_type: 'MARKET_SCAN',
    system_instruction:
      `You are 'AlphaQuant', a highly risk-averse, world-class quantitative crypto analyst. ` +
      `Your goal is to identify high-probability trades with defined entry/exit points, leveraging ` +
      `real-time data and grounded web search analysis. You must always justify your trade using ` +
      `market structure, macroeconomic trends, or technical analysis. You must output your analysis first, ` +
      `followed by a mandatory 'ACTION_JSON' block in this exact format:\n\n` +
      `ACTION_JSON: {"action": "OPEN_LONG_BTC" or "OPEN_SHORT_ETH" or "NO_ACTION", "asset": "BTC-PERP", "size": 0.1, "reasoning": "brief reason"}\n\n` +
      `If no trade is warranted, use: ACTION_JSON: {"action": "NO_ACTION"}`,
    user_template:
      `Current Market State: {{MARKET_PRICES}}.\n\n` +
      `Open Positions: {{OPEN_POSITIONS}}.\n\n` +
      `Based on this data and the most relevant news/macro trends from your web search, perform a comprehensive market assessment. ` +
      `If a trade is warranted, output an action using the ACTION_JSON format. If no trade is warranted, output ACTION_JSON with NO_ACTION.`,
  },
  POSITION_REVIEW: {
    prompt_type: 'POSITION_REVIEW',
    system_instruction:
      `You are 'AlphaQuant', a highly risk-averse, world-class quantitative crypto analyst. ` +
      `Your primary objective is position management. You must assess all current open trades against their original thesis, ` +
      `considering current price action and the latest market events obtained via web search. You must output your analysis first, ` +
      `followed by a mandatory 'ACTION_JSON' block in this exact format:\n\n` +
      `ACTION_JSON: {"action": "CLOSE_BTC" or "HOLD" or "NO_ACTION", "asset": "BTC-PERP", "reasoning": "brief reason"}\n\n` +
      `If no change is needed, use: ACTION_JSON: {"action": "NO_ACTION"}`,
    user_template:
      `Current Market State: {{MARKET_PRICES}}.\n\n` +
      `Open Positions: {{OPEN_POSITIONS}}.\n\n` +
      `Provide a position management assessment for each open trade. Use ACTION_JSON to communicate your decision, or default to NO_ACTION when holding is preferred.`,
  },
}

interface AgentWithPromptRefs {
  id: string
  user_id: string
  market_prompt_id?: string | null
  position_prompt_id?: string | null
}

interface ResolvePromptResult {
  template: PromptRecord
  promptId: string | null
}

export async function resolvePromptTemplate(
  supabase: SupabaseClient,
  agent: AgentWithPromptRefs,
  promptType: PromptType
): Promise<ResolvePromptResult> {
  const selectedPromptId =
    promptType === 'MARKET_SCAN' ? agent.market_prompt_id : agent.position_prompt_id

  if (selectedPromptId) {
    const { data: directMatch, error: directError } = await supabase
      .from('prompts')
      .select('id, user_id, name, description, prompt_type, system_instruction, user_template, is_default, is_active, updated_at')
      .eq('id', selectedPromptId)
      .eq('is_active', true)
      .limit(1)

    if (directError) {
      console.error('Error fetching agent prompt', directError)
    }

    if (directMatch && directMatch.length > 0) {
      return {
        template: directMatch[0] as PromptRecord,
        promptId: directMatch[0].id,
      }
    }
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from('prompts')
    .select('id, user_id, name, description, prompt_type, system_instruction, user_template, is_default, is_active, updated_at')
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .or(`user_id.eq.${agent.user_id},user_id.is.null`)
    .order('user_id', { ascending: false })
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)

  if (candidatesError) {
    console.error('Error fetching fallback prompts', candidatesError)
  }

  if (candidates && candidates.length > 0) {
    return {
      template: candidates[0] as PromptRecord,
      promptId: candidates[0].id,
    }
  }

  const fallback = FALLBACK_PROMPTS[promptType]
  return {
    template: fallback,
    promptId: fallback.id ?? null,
  }
}

export function listPromptPlaceholders(): Record<string, string> {
  return {
    MARKET_PRICES: 'Comma separated list of tracked assets with price and 24h change',
    MARKET_DATA_JSON: 'JSON payload of the market data array',
    OPEN_POSITIONS: 'Human-readable string of current open positions or "None"',
    OPEN_POSITIONS_JSON: 'JSON payload of current open positions',
    PROMPT_TYPE: 'The prompt type being executed (MARKET_SCAN or POSITION_REVIEW)',
    TIMESTAMP: 'ISO timestamp when the prompt was generated',
  }
}
