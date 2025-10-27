import { createSupabaseServiceClient } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { fetchHyperliquidMarketData } from '../_shared/hyperliquid.ts';
import { callGeminiAPI, buildPrompt } from '../_shared/gemini.ts';
import { callDeepseekAPI } from '../_shared/deepseek.ts';
import { callOpenAIAPI } from '../_shared/openai.ts';
import { callAnthropicAPI } from '../_shared/anthropic.ts';
import { resolvePromptTemplate } from '../_shared/prompts.ts';
console.log('Run Agent Assessment function started');
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { agent_id } = await req.json();
    if (!agent_id) {
      throw new Error('agent_id is required');
    }
    console.log('Running assessment for agent:', agent_id);
    // Use service role client for backend operations
    const supabase = createSupabaseServiceClient();
    // 1. Fetch agent configuration
    const { data: agent, error: agentError } = await supabase.from('agents').select('*').eq('id', agent_id).single();
    if (agentError || !agent) {
      throw new Error('Agent not found');
    }
    console.log('Agent found:', agent.name);
    // Check if agent is active
    if (!agent.is_active) {
      console.log('Agent is not active, skipping assessment');
      return new Response(JSON.stringify({
        success: true,
        message: 'Agent is not active',
        skipped: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // 2. Fetch current open positions
    const { data: openPositions, error: positionsError } = await supabase.from('trades').select('*').eq('agent_id', agent_id).eq('status', 'OPEN');
    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      throw positionsError;
    }
    console.log('Open positions:', openPositions?.length || 0);
    // 3. Fetch real-time market data from Hyperliquid
    console.log('Fetching market data...');
    const marketData = await fetchHyperliquidMarketData();
    console.log('Market data fetched:', marketData.length, 'assets');
    // 4. Determine prompt type
    const hasOpenPositions = openPositions && openPositions.length > 0;
    const promptType = hasOpenPositions ? 'POSITION_REVIEW' : 'MARKET_SCAN';
    console.log('Assessment type:', promptType);
    // 5. Construct market data snapshot
    const marketDataSnapshot = {
      timestamp: new Date().toISOString(),
      market_prices: marketData,
      open_positions: openPositions || []
    };
    // 6. Resolve prompt template + build LLM prompt
    const { template: promptTemplate } = await resolvePromptTemplate(supabase, agent, promptType);
    const prompt = buildPrompt(promptTemplate, {
      promptType,
      marketData,
      openPositions: openPositions || []
    });
    // 7. Call provider-specific LLM
    const provider = (agent.llm_provider || 'google').toLowerCase();
    const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;
    let llmResponse;
    switch (provider) {
      case 'deepseek':
        console.log('Calling DeepSeek API...');
        llmResponse = await callDeepseekAPI(prompt, modelName);
        break;
      case 'openai':
        console.log('Calling OpenAI API...');
        llmResponse = await callOpenAIAPI(prompt, modelName);
        break;
      case 'anthropic':
        console.log('Calling Anthropic API...');
        llmResponse = await callAnthropicAPI(prompt, modelName);
        break;
      case 'google':
        console.log('Calling Gemini API...');
        llmResponse = await callGeminiAPI(prompt, modelName);
        break;
      default:
        console.warn(`LLM provider "${agent.llm_provider}" not yet supported. Falling back to Gemini.`);
        llmResponse = await callGeminiAPI(prompt);
        break;
    }
    console.log('LLM response received, action:', llmResponse.action);
    // 8. Log assessment to database
    const { data: assessment, error: assessmentError } = await supabase.from('assessments').insert([
      {
        agent_id: agent_id,
        timestamp: new Date().toISOString(),
        type: promptType,
        market_data_snapshot: marketDataSnapshot,
        llm_prompt_used: `${prompt.systemInstruction}\n\n${prompt.userQuery}`,
        llm_response_text: llmResponse.text,
        trade_action_taken: llmResponse.action
      }
    ]).select().single();
    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError);
      throw assessmentError;
    }
    console.log('Assessment saved:', assessment.id);

    // 9. Calculate and record PnL snapshot
    try {
      // Fetch all closed trades to calculate realized PnL
      const { data: closedTrades } = await supabase
        .from('trades')
        .select('realized_pnl')
        .eq('agent_id', agent_id)
        .eq('status', 'CLOSED');

      const realizedPnl = (closedTrades || [])
        .reduce((sum, trade) => sum + (parseFloat(trade.realized_pnl) || 0), 0);

      // Calculate unrealized PnL from open positions
      const priceMap = new Map(
        marketData.map(asset => [asset.symbol, asset.price])
      );

      const unrealizedPnl = (openPositions || []).reduce((sum, position) => {
        const currentPrice = priceMap.get(position.asset);
        if (!currentPrice || !position.entry_price || !position.size) return sum;

        const entryValue = parseFloat(position.entry_price) * parseFloat(position.size);
        const currentValue = currentPrice * parseFloat(position.size);
        const positionPnl = position.side === 'LONG'
          ? currentValue - entryValue
          : entryValue - currentValue;

        return sum + positionPnl;
      }, 0);

      const initialCapital = parseFloat(agent.initial_capital) || 0;
      const equity = initialCapital + realizedPnl + unrealizedPnl;

      // Insert snapshot
      const { error: snapshotError } = await supabase
        .from('agent_pnl_snapshots')
        .insert([{
          agent_id: agent_id,
          timestamp: new Date().toISOString(),
          equity: equity,
          realized_pnl: realizedPnl,
          unrealized_pnl: unrealizedPnl,
          open_positions_count: openPositions?.length || 0,
          margin_used: 0, // TODO: Calculate from position sizes
          assessment_id: assessment.id,
        }]);

      if (snapshotError) {
        console.error('Error saving PnL snapshot:', snapshotError);
        // Don't throw - snapshot is non-critical
      } else {
        console.log('PnL snapshot recorded:', { equity, realizedPnl, unrealizedPnl });
      }
    } catch (snapshotErr) {
      console.error('Error recording snapshot:', snapshotErr);
      // Continue execution even if snapshot fails
    }

    // 10. Execute trade action if needed
    let tradeResult = null;
    if (llmResponse.action && llmResponse.action !== 'NO_ACTION') {
      console.log('Trade action detected, calling execute_hyperliquid_trade...');
      try {
        // Call the execute trade function
        const tradeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/execute_hyperliquid_trade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            agent_id: agent_id,
            action: llmResponse.action,
            hyperliquid_address: agent.hyperliquid_address
          })
        });
        if (tradeResponse.ok) {
          tradeResult = await tradeResponse.json();
          console.log('Trade executed:', tradeResult);
        } else {
          console.error('Trade execution failed:', await tradeResponse.text());
        }
      } catch (error) {
        console.error('Error executing trade:', error);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      assessment_id: assessment.id,
      action_taken: llmResponse.action,
      trade_result: tradeResult,
      agent_name: agent.name,
      type: promptType
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in run_agent_assessment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
