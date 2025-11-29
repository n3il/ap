import { createSupabaseServiceClient } from '../supabase.ts';
import type { Agent } from './types.ts';
import type { AuthContext } from './auth.ts';

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
