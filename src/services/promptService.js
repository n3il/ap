import { supabase } from '@/config/supabase';

export const PROMPT_SLOTS = {
  MARKET: 'market',
  POSITION: 'position',
};

const PROMPT_SLOT_COLUMN_MAP = {
  [PROMPT_SLOTS.MARKET]: 'market_prompt_id',
  [PROMPT_SLOTS.POSITION]: 'position_prompt_id',
};

export const PROMPT_PLACEHOLDERS = {
  '{{MARKET_PRICES}}': 'Comma-separated list of tracked assets with price and 24h change',
  '{{MARKET_DATA_JSON}}': 'Full market data payload as formatted JSON',
  '{{OPEN_POSITIONS}}': 'Human-readable summary of open positions or "None"',
  '{{OPEN_POSITIONS_JSON}}': 'Open positions array as formatted JSON',
  '{{PROMPT_TYPE}}': 'Either MARKET_SCAN or POSITION_REVIEW',
  '{{TIMESTAMP}}': 'ISO timestamp when the prompt is rendered',
};

const ensureAuthenticatedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

export const promptService = {
  /**
   * Fetch prompts visible to the user (global + personal).
   */
  async listPrompts() {
    const user = await ensureAuthenticatedUser();

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('user_id', { ascending: false })
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Create a prompt owned by the current user.
   */
  async createPrompt(prompt) {
    const user = await ensureAuthenticatedUser();

    const payload = {
      ...prompt,
      user_id: user.id,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a user-owned prompt.
   */
  async updatePrompt(promptId, updates) {
    const { data, error } = await supabase
      .from('prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete / disable a prompt.
   */
  async disablePrompt(promptId) {
    const { data, error } = await supabase
      .from('prompts')
      .update({ is_active: false })
      .eq('id', promptId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Assign a prompt to an agent for a given slot (market or position).
   */
  async assignPromptToAgent(agentId, slot, promptId) {
    const column = PROMPT_SLOT_COLUMN_MAP[slot];
    if (!column) {
      throw new Error(`Unsupported prompt slot: ${slot}`);
    }

    const { data, error } = await supabase
      .from('agents')
      .update({ [column]: promptId ?? null })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
