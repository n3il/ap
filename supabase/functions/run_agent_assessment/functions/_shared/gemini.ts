// Google Gemini API integration
export async function callGeminiAPI(prompt) {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable not set');
  }
  const model = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt.userQuery
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: prompt.systemInstruction
            }
          ]
        },
        tools: [
          {
            googleSearch: {}
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    const text = data.candidates[0].content.parts[0].text;
    // Parse ACTION_JSON from response
    // Expected format: ACTION_JSON: {"action": "OPEN_LONG_BTC", "asset": "BTC-PERP", "size": 0.1}
    let action = 'NO_ACTION';
    let actionDetails = null;
    const actionJsonMatch = text.match(/ACTION_JSON:\s*({[^}]+})/s);
    if (actionJsonMatch) {
      try {
        actionDetails = JSON.parse(actionJsonMatch[1]);
        action = actionDetails.action || 'NO_ACTION';
      } catch (e) {
        console.error('Failed to parse ACTION_JSON:', e);
      }
    }
    // Alternative format: look for explicit action commands
    if (action === 'NO_ACTION') {
      const actionPatterns = [
        /OPEN_LONG_([A-Z]+)/,
        /OPEN_SHORT_([A-Z]+)/,
        /CLOSE_([A-Z]+)/,
        /NO_ACTION/
      ];
      for (const pattern of actionPatterns){
        const match = text.match(pattern);
        if (match) {
          action = match[0];
          break;
        }
      }
    }
    return {
      text,
      action,
      rawResponse: data
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
export function buildPrompt(type, marketData, openPositions) {
  const systemInstruction = type === 'MARKET_SCAN' ? `You are 'AlphaQuant', a highly risk-averse, world-class quantitative crypto analyst. Your goal is to identify high-probability trades with defined entry/exit points, leveraging real-time data and grounded web search analysis. You must always justify your trade using market structure, macroeconomic trends, or technical analysis. You must output your analysis first, followed by a mandatory 'ACTION_JSON' block in this exact format:

ACTION_JSON: {"action": "OPEN_LONG_BTC" or "OPEN_SHORT_ETH" or "NO_ACTION", "asset": "BTC-PERP", "size": 0.1, "reasoning": "brief reason"}

If no trade is warranted, use: ACTION_JSON: {"action": "NO_ACTION"}` : `You are 'AlphaQuant', a highly risk-averse, world-class quantitative crypto analyst. Your primary objective is position management. You must assess all current open trades against their original thesis, considering current price action and the latest market events obtained via web search. You must output your analysis first, followed by a mandatory 'ACTION_JSON' block in this exact format:

ACTION_JSON: {"action": "CLOSE_BTC" or "HOLD" or "NO_ACTION", "asset": "BTC-PERP", "reasoning": "brief reason"}

If no change is needed, use: ACTION_JSON: {"action": "NO_ACTION"}`;
  const marketPricesText = marketData.map((m)=>`${m.asset}: $${m.price.toLocaleString()} (${m.change_24h > 0 ? '+' : ''}${m.change_24h.toFixed(2)}%)`).join(', ');
  const userQuery = type === 'MARKET_SCAN' ? `Current Market State: ${marketPricesText}.

Open Positions: None.

Based on this data and the most relevant news/macro trends from your web search, perform a comprehensive market assessment. If a trade is warranted, output an action using the ACTION_JSON format. If no trade is warranted, output ACTION_JSON with NO_ACTION.` : `Current Market State: ${marketPricesText}.

Open Positions: ${JSON.stringify(openPositions, null, 2)}

For each open position, determine if it should be held, closed (take profit/stop loss), or reversed. Use web search for updated context. Output your decision using the ACTION_JSON format. If no change is needed, output ACTION_JSON with NO_ACTION.`;
  return {
    systemInstruction,
    userQuery
  };
}
