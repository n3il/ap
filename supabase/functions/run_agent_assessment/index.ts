import { createSupabaseClient, createSupabaseServiceClient } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { fetchHyperliquidMarketData, fetchAllCandleData } from '../_shared/hyperliquid.ts';
import { callGeminiAPI, buildPrompt } from '../_shared/gemini.ts';
import { callDeepseekAPI } from '../_shared/deepseek.ts';
import { callOpenAIAPI } from '../_shared/openai.ts';
import { callAnthropicAPI } from '../_shared/anthropic.ts';
import { resolvePromptTemplate } from '../_shared/prompts.ts';

console.log('Run Agent Assessment function started.');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agent_id } = await req.json();
    if (!agent_id) throw new Error('agent_id is required');

    console.log('Running assessment for agent:', agent_id);

    // --- AUTH SECTION ---
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Determine client type: service or user
    const isServiceRequest = authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabase = isServiceRequest
      ? createSupabaseServiceClient()
      : createSupabaseClient(authHeader);

    let userId: string | null = null;

    if (!isServiceRequest) {
      // Validate user JWT if it’s not a service key
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User auth failed:', authError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      userId = user.id;
      console.log('User authenticated:', user.id);
    } else {
      console.log('Authenticated as service (scheduler)');
    }

    // --- AGENT VALIDATION ---
    const serviceClient = createSupabaseServiceClient();
    const query = serviceClient.from('agents').select('*').eq('id', agent_id);
    if (!isServiceRequest) query.eq('user_id', userId);
    const { data: agent, error: agentError } = await query.single();

    if (agentError || !agent) {
      console.error('Agent not found or unauthorized:', agentError);
      return new Response(JSON.stringify({ error: 'Agent not found or unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Agent found:', agent.name);

    if (!agent.is_active) {
      console.log('Agent inactive — skipping assessment');
      return new Response(JSON.stringify({
        success: true,
        message: 'Agent inactive',
        skipped: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- FETCH DATA ---
    const { data: openPositions, error: positionsError } = await serviceClient
      .from('trades')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('status', 'OPEN');
    if (positionsError) throw positionsError;

    console.log(`Open positions: ${openPositions?.length || 0}`);

    const [marketData, candleData] = await Promise.all([
      fetchHyperliquidMarketData(),
      fetchAllCandleData(5, 3), // 5-minute candles for last 3 hours
    ]);
    console.log(`Fetched ${marketData.length} market assets and candle data for ${Object.keys(candleData).length} assets`);

    // --- DETERMINE PROMPT ---
    const hasOpenPositions = openPositions && openPositions.length > 0;
    const promptType = hasOpenPositions ? 'POSITION_REVIEW' : 'MARKET_SCAN';
    console.log('Prompt type:', promptType);

    const marketDataSnapshot = {
      timestamp: new Date().toISOString(),
      market_prices: marketData,
      open_positions: openPositions || [],
    };

    // --- CALCULATE ACCOUNT VALUE AND REMAINING CASH ---
    const { data: closedTrades } = await serviceClient
      .from('trades')
      .select('realized_pnl')
      .eq('agent_id', agent_id)
      .eq('status', 'CLOSED');

    const realizedPnl = (closedTrades || []).reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0);
    const priceMap = new Map(marketData.map((a) => [a.symbol, a.price]));

    const unrealizedPnl = (openPositions || []).reduce((sum, p) => {
      const price = priceMap.get(p.asset);
      if (!price || !p.entry_price || !p.size) return sum;

      const leverage = parseFloat(p.leverage) || 1;
      const size = parseFloat(p.size);
      const entryPrice = parseFloat(p.entry_price);

      // Calculate price change
      const priceChange = price - entryPrice;

      // PnL with leverage: (priceChange / entryPrice) * positionValue * leverage
      // For LONG: profit when price goes up
      // For SHORT: profit when price goes down
      const positionValue = size * entryPrice;
      const pnl = p.side === 'LONG'
        ? (priceChange / entryPrice) * positionValue * leverage
        : -(priceChange / entryPrice) * positionValue * leverage;

      return sum + pnl;
    }, 0);

    const initialCapital = parseFloat(agent.initial_capital) || 0;
    const accountValue = initialCapital + realizedPnl + unrealizedPnl;

    // Calculate margin used (position value / leverage)
    // With leverage, you only need to put up a fraction of the position value as margin
    // Example: $1000 position with 10x leverage requires only $100 margin
    const marginUsed = (openPositions || []).reduce((sum, p) => {
      const price = priceMap.get(p.asset);
      if (!price || !p.size) return sum;

      const leverage = parseFloat(p.leverage) || 1;
      const size = parseFloat(p.size);
      const positionValue = price * size;

      // Margin required = position value / leverage
      const margin = positionValue / leverage;

      return sum + margin;
    }, 0);

    const remainingCash = accountValue - marginUsed;

    const { template: promptTemplate } = await resolvePromptTemplate(serviceClient, agent, promptType);
    const prompt = buildPrompt(promptTemplate, {
      promptType,
      marketData,
      openPositions: openPositions || [],
      accountValue,
      remainingCash,
      candleData,
    });

    // --- CALL LLM PROVIDER ---
    const provider = (agent.llm_provider || 'google').toLowerCase();
    const modelName = typeof agent.model_name === 'string' ? agent.model_name : undefined;

    let llmResponse;
    switch (provider) {
      case 'deepseek': llmResponse = await callDeepseekAPI(prompt, modelName); break;
      case 'openai': llmResponse = await callOpenAIAPI(prompt, modelName); break;
      case 'anthropic': llmResponse = await callAnthropicAPI(prompt, modelName); break;
      default: llmResponse = await callGeminiAPI(prompt, modelName); break;
    }
    console.log('LLM response received, action:', llmResponse.action);

    // --- SAVE ASSESSMENT ---
    const { data: assessment, error: assessmentError } = await serviceClient
      .from('assessments')
      .insert([{
        agent_id,
        timestamp: new Date().toISOString(),
        type: promptType,
        market_data_snapshot: marketDataSnapshot,
        llm_prompt_used: `${prompt.systemInstruction}\n\n${prompt.userQuery}`,
        llm_response_text: llmResponse.text,
        trade_action_taken: llmResponse.action,
      }])
      .select()
      .single();
    if (assessmentError) throw assessmentError;

    console.log('Assessment saved:', assessment.id);

    // --- PNL SNAPSHOT ---
    try {
      const { error: snapshotError } = await serviceClient
        .from('agent_pnl_snapshots')
        .insert([{
          agent_id,
          timestamp: new Date().toISOString(),
          equity: accountValue,
          realized_pnl: realizedPnl,
          unrealized_pnl: unrealizedPnl,
          open_positions_count: openPositions?.length || 0,
          margin_used: marginUsed,
          assessment_id: assessment.id,
        }]);

      if (snapshotError) console.error('PnL snapshot save error:', snapshotError);
      else console.log('PnL snapshot saved:', { equity: accountValue, realizedPnl, unrealizedPnl, marginUsed });
    } catch (err) {
      console.error('PnL snapshot error:', err);
    }

    // --- TRADE EXECUTION ---
    let tradeResult = null;
    if (llmResponse.action && llmResponse.action !== 'NO_ACTION') {
      console.log('Executing trade action...');
      try {
        const tradeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/execute_hyperliquid_trade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            agent_id,
            action: llmResponse.action,
            hyperliquid_address: agent.hyperliquid_address,
          }),
        });
        if (tradeResponse.ok) tradeResult = await tradeResponse.json();
        else console.error('Trade execution failed:', await tradeResponse.text());
      } catch (err) {
        console.error('Trade execution error:', err);
      }
    }

    // --- SUCCESS RESPONSE ---
    return new Response(JSON.stringify({
      success: true,
      assessment_id: assessment.id,
      action_taken: llmResponse.action,
      trade_result: tradeResult,
      agent_name: agent.name,
      type: promptType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in run_agent_assessment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
