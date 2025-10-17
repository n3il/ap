import { createSupabaseServiceClient } from '../_shared/supabase.ts'

console.log('Agent Scheduler cron job started')

Deno.serve(async (req) => {
  try {
    console.log('Running agent scheduler...')

    const supabase = createSupabaseServiceClient()

    // Fetch all active agents
    const { data: activeAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, is_active')
      .eq('is_active', true)

    if (agentsError) {
      console.error('Error fetching active agents:', agentsError)
      throw agentsError
    }

    console.log(`Found ${activeAgents?.length || 0} active agents`)

    if (!activeAgents || activeAgents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active agents to process',
          processed: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Run assessments for each active agent
    const results = []

    for (const agent of activeAgents) {
      console.log(`Processing agent: ${agent.name} (${agent.id})`)

      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/run_agent_assessment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              agent_id: agent.id,
            }),
          }
        )

        if (response.ok) {
          const result = await response.json()
          results.push({
            agent_id: agent.id,
            agent_name: agent.name,
            success: true,
            result,
          })
          console.log(`✓ Agent ${agent.name} processed successfully`)
        } else {
          const errorText = await response.text()
          results.push({
            agent_id: agent.id,
            agent_name: agent.name,
            success: false,
            error: errorText,
          })
          console.error(`✗ Agent ${agent.name} failed:`, errorText)
        }
      } catch (error) {
        results.push({
          agent_id: agent.id,
          agent_name: agent.name,
          success: false,
          error: error.message,
        })
        console.error(`✗ Agent ${agent.name} error:`, error.message)
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    console.log(`Scheduler completed: ${successCount} succeeded, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${activeAgents.length} agents`,
        total: activeAgents.length,
        succeeded: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in agent_scheduler:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
