import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Agent function started')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create authenticated Supabase client
    const supabase = createSupabaseClient(authHeader)

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const {
      name,
      llm_provider,
      model_name,
      hyperliquid_address,
      initial_capital,
      market_prompt_id,
      position_prompt_id,
    } = await req.json()

    // Validate required fields
    if (!name || !llm_provider || !model_name || !hyperliquid_address || !initial_capital) {
      throw new Error('Missing required fields')
    }

    // Validate initial_capital is a positive number
    if (typeof initial_capital !== 'number' || initial_capital <= 0) {
      throw new Error('initial_capital must be a positive number')
    }

    // Insert new agent (is_active set to current timestamp = active)
    const { data: agent, error: insertError } = await supabase
      .from('agents')
      .insert([
        {
          user_id: user.id,
          name,
          llm_provider,
          model_name,
          hyperliquid_address,
          initial_capital,
          is_active: new Date().toISOString(),
          market_prompt_id: market_prompt_id ?? null,
          position_prompt_id: position_prompt_id ?? null,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        agent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create_agent:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
