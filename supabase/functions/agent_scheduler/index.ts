import { createSupabaseServiceClient } from '../_shared/supabase.ts';

console.log('Agent Scheduler cron job started');

/**
 * Run tasks in parallel with limited concurrency.
 */
async function runWithConcurrency(agents, concurrency = 50) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  let index = 0;

  while (index < agents.length) {
    const batch = agents.slice(index, index + concurrency);

    // Trigger this batch concurrently (no await for internal function responses)
    await Promise.allSettled(
      batch.map((agent) =>
        fetch(`${SUPABASE_URL}/functions/v1/run_agent_assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ agent_id: agent.id }),
        })
          .then((res) => {
            if (res.ok) {
              console.log(`✓ Triggered ${agent.name} (${agent.id})`);
            } else {
              console.error(`✗ Failed to trigger ${agent.name}:`, res.status);
            }
          })
          .catch((err) => {
            console.error(`✗ Error triggering ${agent.name}:`, err.message);
          })
      )
    );

    index += concurrency;
    console.log(`Processed batch ${Math.min(index, agents.length)}/${agents.length}`);
  }
}

Deno.serve(async (_req) => {
  try {
    console.log('Running agent scheduler...');

    const supabase = createSupabaseServiceClient();

    // 1. Fetch all active agents (is_active NOT NULL)
    const { data: activeAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, is_active')
      .not('is_active', 'is', null);

    if (agentsError) throw agentsError;

    const totalAgents = activeAgents?.length || 0;
    console.log(`Found ${totalAgents} active agents`);

    if (!activeAgents || totalAgents === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active agents to process',
          processed: 0,
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Run all in concurrency-limited batches
    await runWithConcurrency(activeAgents, 50);

    console.log(`✓ Scheduler dispatched ${totalAgents} agent assessments`);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Triggered ${totalAgents} agent assessments asynchronously`,
        total: totalAgents,
        concurrency: 50,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in agent_scheduler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
