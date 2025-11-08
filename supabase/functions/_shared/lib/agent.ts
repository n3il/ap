import { createSupabaseServiceClient } from '../supabase.ts';
import { validateRequiredFields, validatePositiveNumber } from './validation.ts';
import type { Agent } from './types.ts';
import type { AuthContext } from './auth.ts';

export interface CreateAgentInput {
  name: string;
  llm_provider: string;
  model_name: string;
  hyperliquid_address: string;
  initial_capital: number;
  prompt_id?: string | null;
}

/**
 * Fetches and validates an agent
 * Ensures user owns the agent if not a service request
 */
export async function fetchAndValidateAgent(
  agentId: string,
  authContext: AuthContext
): Promise<Agent> {
  const serviceClient = createSupabaseServiceClient();
  const query = serviceClient.from('agents').select('*').eq('id', agentId);

  // If user request, ensure they own the agent
  if (!authContext.isServiceRequest && authContext.userId) {
    query.eq('user_id', authContext.userId);
  }

  const { data: agent, error: agentError } = await query.single();

  if (agentError || !agent) {
    throw new Error('Agent not found or unauthorized');
  }

  console.log('Agent found:', agent.name);
  return agent as Agent;
}

/**
 * Checks if agent should be processed
 */
export function isAgentActive(agent: Agent): boolean {
  return !!agent.is_active;
}

/**
 * Validates create agent input data
 */
export function validateAgentInput(data: any): CreateAgentInput {
  validateRequiredFields(data, [
    'name',
    'llm_provider',
    'model_name',
    'hyperliquid_address',
    'initial_capital',
  ]);

  const initial_capital = validatePositiveNumber(data.initial_capital, 'initial_capital');

  return {
    name: data.name,
    llm_provider: data.llm_provider,
    model_name: data.model_name,
    hyperliquid_address: data.hyperliquid_address,
    initial_capital,
    prompt_id: data.prompt_id ?? null,
  };
}

/**
 * Creates a new agent in the database
 */
export async function createAgent(
  supabase: any,
  userId: string,
  input: CreateAgentInput
): Promise<Agent> {
  const { data: agent, error } = await supabase
    .from('agents')
    .insert([
      {
        user_id: userId,
        name: input.name,
        llm_provider: input.llm_provider,
        model_name: input.model_name,
        hyperliquid_address: input.hyperliquid_address,
        initial_capital: input.initial_capital,
        is_active: new Date().toISOString(),
        prompt_id: input.prompt_id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  return agent as Agent;
}

/**
 * Fetches agent data from database
 */
export async function fetchAgent(agentId: string): Promise<Agent> {
  const supabase = createSupabaseServiceClient();

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, user_id, name')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    throw new Error(`Unable to load agent ${agentId}`);
  }

  return agent as Agent;
}
