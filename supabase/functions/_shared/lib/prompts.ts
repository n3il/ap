/**
 * Simple prompt fetching from database
 * No fallbacks - prompts must exist in database
 */

export type PromptType = 'MARKET_SCAN' | 'POSITION_REVIEW';

export interface PromptRecord {
  id: string;
  user_id?: string | null;
  name?: string;
  description?: string | null;
  prompt_type: PromptType;
  system_instruction: string;
  user_template: string;
  is_default?: boolean;
  is_active?: boolean;
  updated_at?: string;
}

interface Agent {
  id: string;
  user_id: string;
  market_prompt_id?: string | null;
  position_prompt_id?: string | null;
}

/**
 * Fetches prompt from database for an agent
 * Priority: agent's custom prompt -> user's default -> global default
 */
export async function fetchPrompt(
  supabase: any,
  agent: Agent,
  promptType: PromptType
): Promise<PromptRecord> {
  const selectedPromptId =
    promptType === 'MARKET_SCAN' ? agent.market_prompt_id : agent.position_prompt_id;

  // Try agent's specific prompt first
  if (selectedPromptId) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', selectedPromptId)
      .eq('is_active', true)
      .single();

    if (!error && data) {
      return data as PromptRecord;
    }
  }

  // Fallback to best matching prompt (user's or global default)
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .or(`user_id.eq.${agent.user_id},user_id.is.null`)
    .order('user_id', { ascending: false }) // User prompts first
    .order('is_default', { ascending: false }) // Then defaults
    .order('updated_at', { ascending: false }) // Then most recent
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(
      `No ${promptType} prompt found. Please create a prompt in the database.`
    );
  }

  return data as PromptRecord;
}
