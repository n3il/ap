import type { Agent } from './types.ts';

/**
 * Simple prompt fetching from database
 * No fallbacks - prompts must exist in database
 */

export interface PromptRecord {
  id: string;
  user_id?: string | null;
  name?: string;
  description?: string | null;
  system_instruction: string;
  user_template: string;
  is_default?: boolean;
  is_active?: boolean;
  updated_at?: string;
}

/**
 * Fetches the best available prompt for an agent's owner.
 * Priority: user's default/most recent prompt -> global default prompt.
 */
export async function fetchPrompt(
  supabase: any,
  agent: Agent
): Promise<PromptRecord> {
  // Fetch the best matching prompt (user's or global default)
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_active', true)
    .or(`user_id.eq.${agent.user_id},user_id.is.null`)
    .order('user_id', { ascending: false }) // User prompts first
    .order('is_default', { ascending: false }) // Then defaults
    .order('updated_at', { ascending: false }) // Then most recent
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No prompt found. Please create a prompt in the database.');
  }

  return data as PromptRecord;
}
