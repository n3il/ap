import type { GeminiPrompt, LLMResponse } from './gemini.ts'
import { parseActionFromText } from './gemini.ts'

const DEFAULT_MODEL = 'deepseek-chat'
const API_URL = 'https://api.deepseek.com/chat/completions'

export async function callDeepseekAPI(
  prompt: GeminiPrompt,
  modelOverride?: string
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY')

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable not set')
  }

  const model = modelOverride || DEFAULT_MODEL

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt.systemInstruction },
        { role: 'user', content: prompt.userQuery },
      ],
      temperature: 0.7,
      top_p: 0.95,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('DeepSeek API error response:', errorText)
    throw new Error(`DeepSeek API error: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new Error('No response from DeepSeek API')
  }

  const action = parseActionFromText(text)

  return {
    text,
    action,
    rawResponse: data,
  }
}
