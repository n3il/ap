import type { GeminiPrompt, LLMResponse } from './gemini.ts'
import { parseActionFromText } from './gemini.ts'

const DEFAULT_MODEL = 'claude-3-5-haiku-20241022'
const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

export async function callAnthropicAPI(
  prompt: GeminiPrompt,
  modelOverride?: string
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }

  const model = modelOverride || DEFAULT_MODEL

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.7,
      system: prompt.systemInstruction,
      messages: [
        {
          role: 'user',
          content: prompt.userQuery,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error response:', errorText)
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()

  const text = (data?.content ?? [])
    .map((part: any) => {
      if (typeof part === 'string') {
        return part
      }
      if (typeof part?.text === 'string') {
        return part.text
      }
      return ''
    })
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('No response from Anthropic API')
  }

  const action = parseActionFromText(text)

  return {
    text,
    action,
    rawResponse: data,
  }
}
