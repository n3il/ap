import type { GeminiPrompt, LLMResponse } from './gemini.ts'
import { tryParseText } from "./llm/providers.ts";

const DEFAULT_MODEL = 'gpt-4o-mini'
const API_URL = 'https://api.openai.com/v1/chat/completions'

export async function callOpenAIAPI(
  prompt: GeminiPrompt,
  modelOverride?: string
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set')
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
    console.error('OpenAI API error response:', errorText)
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  let text = data?.choices?.[0]?.message?.content

  if (Array.isArray(text)) {
    text = text
      .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
      .join('\n')
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('No response from OpenAI API')
  }

  const parsed = tryParseText(text)

  return {
    text,
    parsed,
    rawResponse: data,
  }
}
