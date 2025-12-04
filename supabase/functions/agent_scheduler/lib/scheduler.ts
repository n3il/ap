import { createSupabaseServiceClient } from '../../_shared/supabase.ts';
import type { Agent } from '../../_shared/lib/types.ts';
import { externalFetch } from '../../_shared/lib/external_request.ts';

/**
 * Fetches all active agents from the database
 */
export async function fetchActiveAgents(): Promise<Agent[]> {
  const supabase = createSupabaseServiceClient();

  const { data: activeAgents, error } = await supabase
    .from('agents')
    .select('id, name, is_active')
    .not('is_active', 'is', null);

  if (error) throw error;

  const agents = (activeAgents || []) as Agent[];
  console.log(`Found ${agents.length} active agents`);

  return agents;
}

/**
 * Triggers an assessment for a single agent
 */
async function triggerAgentAssessment(agent: Agent): Promise<void> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const requestUrl = `${SUPABASE_URL}/functions/v1/run_agent_assessment`;

  const response = await externalFetch(
    requestUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ agent_id: agent.id }),
    },
    async (res) => {
      const clonedResponse = res.clone();
      let responseBody: unknown;

      try {
        responseBody = await clonedResponse.json();
      } catch {
        try {
          responseBody = await clonedResponse.text();
        } catch {
          responseBody = undefined;
        }
      }

      return {
        name: 'run-agent-assessment',
        url: requestUrl,
        method: 'POST',
        requestBody: { agentId: agent.id },
        responseBody,
      };
    }
  );

  if (response.ok) {
    console.log(`✓ Triggered ${agent.name} (${agent.id})`);
  } else {
    console.error(`✗ Failed to trigger ${agent.name}:`, response.status);
  }
}

/**
 * Runs assessments for agents with controlled concurrency
 * Processes agents in batches to avoid overwhelming the system
 */
export async function runWithConcurrency(
  agents: Agent[],
  concurrency: number = 50
): Promise<void> {
  let index = 0;

  while (index < agents.length) {
    const batch = agents.slice(index, index + concurrency);

    // Process batch with allSettled to continue even if some fail
    await Promise.allSettled(
      batch.map((agent) => triggerAgentAssessment(agent))
    );

    index += concurrency;
    console.log(`Processed batch ${Math.min(index, agents.length)}/${agents.length}`);
  }
}
