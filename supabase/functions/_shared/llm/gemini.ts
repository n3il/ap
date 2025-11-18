// Google Gemini API integration
import { tryParseText } from "./providers.ts";
import type {
  ParsedLLMResponse,
} from './types.ts'

export interface GeminiPrompt {
  systemInstruction: string
  userQuery: string
}

export interface PromptTemplateInput {
  system_instruction: string
  user_template: string
}

interface BuildPromptContext {
  marketData: any[]
  openPositions: any[]
  accountValue?: number
  remainingCash?: number
  candleData?: Record<string, any[]>
}

export interface GeminiResponse {
  text: string
  parsed: ParsedLLMResponse | null
  rawResponse: unknown
}

export type LLMResponse = GeminiResponse


export async function callGeminiAPI(
  prompt: GeminiPrompt,
  modelOverride?: string
): Promise<GeminiResponse> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable not set')
  }

  const model = modelOverride || 'gemini-2.0-flash-exp'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt.userQuery }],
          },
        ],
        systemInstruction: {
          parts: [{ text: prompt.systemInstruction }],
        },
        tools: [
          {
            googleSearch: {},
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 9000,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const text = data.candidates[0].content.parts[0].text;
    const parsed = tryParseText(text);

    return {
      text,
      parsed: parsed,
      rawResponse: data,
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

export function buildPrompt(
  template: PromptTemplateInput,
  context: BuildPromptContext
): GeminiPrompt {
  const { marketData, openPositions } = context

  const marketPricesText = (marketData || [])
    .map((m: Record<string, unknown>) => {
      const price = Number(m.price ?? 0)
      const change = Number(m.change_24h ?? 0)
      const formattedPrice = Number.isFinite(price)
        ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        : 'N/A'
      const formattedChange = Number.isFinite(change)
        ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
        : 'N/A'
      return `${m.asset ?? 'UNKNOWN'}: ${formattedPrice} (${formattedChange})`
    })
    .join(', ')

  const openPositionsJson = JSON.stringify(openPositions || [], null, 2)
  const openPositionsText =
    openPositions && openPositions.length > 0 ? openPositionsJson : 'None'

  const replacements: Record<string, string> = {
    MARKET_PRICES: marketPricesText,
    MARKET_DATA_JSON: JSON.stringify(marketData ?? [], null, 2),
    OPEN_POSITIONS: openPositionsText,
    OPEN_POSITIONS_JSON: openPositionsJson,
    TIMESTAMP: new Date().toISOString(),
    ACCOUNT_VALUE: context.accountValue !== undefined
      ? `$${context.accountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A',
    REMAINING_CASH: context.remainingCash !== undefined
      ? `$${context.remainingCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A',
    CANDLE_DATA_5M: context.candleData
      ? JSON.stringify(context.candleData, null, 2)
      : 'N/A',
    AVAILABLE_USDT: context.remainingCash !== undefined
      ? `$${context.remainingCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A',
  }

  let userQuery = template.user_template;
  for (const [token, value] of Object.entries(replacements)) {
    userQuery = userQuery.replace(new RegExp(`{{${token}}}`, 'g'), value)
  }
  const systemInstruction = template.system_instruction;

  return { systemInstruction, userQuery }
}
