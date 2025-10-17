import { supabase } from '@/config/supabase';

export const PROMPT_TYPES = {
  MARKET_SCAN: 'MARKET_SCAN',
  POSITION_REVIEW: 'POSITION_REVIEW',
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
  async listPrompts({ promptType } = {}) {
    const user = await ensureAuthenticatedUser();

    let query = supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('user_id', { ascending: false })
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (promptType) {
      query = query.eq('prompt_type', promptType);
    }

    const { data, error } = await query;
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
   * Assign a prompt to an agent for a given type.
   */
  async assignPromptToAgent(agentId, promptType, promptId) {
    if (!Object.values(PROMPT_TYPES).includes(promptType)) {
      throw new Error(`Unsupported prompt type: ${promptType}`);
    }

    const column =
      promptType === PROMPT_TYPES.MARKET_SCAN ? 'market_prompt_id' : 'position_prompt_id';

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
