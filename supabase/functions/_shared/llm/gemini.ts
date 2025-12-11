// Google Gemini API integration
import { tryParseText } from './providers.ts';
import type {
  ParsedLLMResponse,
} from './types.ts'
import { externalFetch } from '../lib/external_request.ts';

export interface GeminiPrompt {
  systemInstruction: string
  userQuery: string
}

export interface PromptTemplateInput {
  system_instruction: string
  user_template: string
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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const response = await externalFetch(`${endpoint}?key=${apiKey}`, {
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
  }, async (res) => ({
    name: 'google-gemini',
    url: endpoint,
    method: 'POST',
    requestBody: { model },
    responseBody: await res.clone().json().catch(() => undefined),
  }))

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
}

export function buildPrompt(
  template: PromptTemplateInput,
  context: Record<string, any>
): GeminiPrompt {
  const replacements: Record<string, string> = {
    ACCOUNT_SUMMARY: JSON.stringify(context.accountSummary),
    TRADEABLE_ASSETS: JSON.stringify(context.tradeableAssets),
    CANDLE_DATA: JSON.stringify(context.candleData),
    TIMESTAMP: new Date().toISOString(),
    PROMPT_DIRECTION: context.promptDirection || '',
  }

  let userQuery = template.user_template;
  for (const [token, value] of Object.entries(replacements)) {
    userQuery = userQuery.replace(new RegExp(`{{${token}}}`, 'g'), value)
  }
  const systemInstruction = template.system_instruction;

  return { systemInstruction, userQuery }
}
