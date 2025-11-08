// Google Gemini API integration
import type {
  LLMHeadlineBlock,
  LLMOverviewBlock,
  LLMTradeAction,
  ParsedLLMResponse,
  TradeActionType,
} from './llm/types.ts'

export interface GeminiPrompt {
  systemInstruction: string
  userQuery: string
}

export interface PromptTemplateInput {
  system_instruction: string
  user_template: string
}

interface BuildPromptContext {
  promptType: 'MARKET_SCAN' | 'POSITION_REVIEW'
  marketData: any[]
  openPositions: any[]
  accountValue?: number
  remainingCash?: number
  candleData?: Record<string, any[]>
}

export interface GeminiResponse {
  text: string
  action: string
  parsed: ParsedLLMResponse | null
  rawResponse: any
}

export type LLMResponse = GeminiResponse

const VALID_TRADE_ACTIONS: TradeActionType[] = [
  'OPEN_LONG',
  'OPEN_SHORT',
  'CLOSE_LONG',
  'CLOSE_SHORT',
  'NO_ACTION',
]

const LEGACY_ACTION_PATTERNS = [
  /OPEN_LONG_([A-Z]+)(?:_(\d+)X)?/,
  /OPEN_SHORT_([A-Z]+)(?:_(\d+)X)?/,
  /CLOSE_([A-Z]+)/,
  /NO_ACTION/,
]

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : undefined
  }
  return undefined
}

function coerceNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeHeadlineBlock(payload: any): LLMHeadlineBlock | null {
  if (!payload || typeof payload !== 'object') return null

  const block: LLMHeadlineBlock = {}

  const shortSummary = coerceString(payload.short_summary ?? payload.shortSummary)
  if (shortSummary) block.short_summary = shortSummary

  const extendedSummary = coerceString(payload.extended_summary ?? payload.extendedSummary)
  if (extendedSummary) block.extended_summary = extendedSummary

  const thesis = coerceString(payload.thesis)
  if (thesis) block.thesis = thesis

  const sentimentWord = coerceString(payload.sentiment_word ?? payload.sentimentWord)
  if (sentimentWord) block.sentiment_word = sentimentWord

  const sentimentScore = coerceNumber(payload.sentiment_score ?? payload.sentimentScore)
  if (sentimentScore !== undefined) block.sentiment_score = sentimentScore

  return Object.keys(block).length ? block : null
}

function normalizeOverviewBlock(payload: any): LLMOverviewBlock | null {
  if (!payload || typeof payload !== 'object') return null

  const block: LLMOverviewBlock = {}

  const macro = coerceString(payload.macro)
  if (macro) block.macro = macro

  const structure = coerceString(payload.market_structure ?? payload.marketStructure)
  if (structure) block.market_structure = structure

  const technical = coerceString(payload.technical_analysis ?? payload.technicalAnalysis)
  if (technical) block.technical_analysis = technical

  return Object.keys(block).length ? block : null
}

function normalizeTradeActionPayload(payload: any): LLMTradeAction | null {
  if (!payload || typeof payload !== 'object') return null

  const normalizedAction = coerceString(payload.action)?.toUpperCase()
  const action = normalizedAction && VALID_TRADE_ACTIONS.includes(normalizedAction as TradeActionType)
    ? (normalizedAction as TradeActionType)
    : normalizedAction === 'NO_ACTION'
      ? 'NO_ACTION'
      : undefined

  if (!action) return null

  const trade: LLMTradeAction = { action }

  const asset = coerceString(payload.asset ?? payload.symbol)
  if (asset) trade.asset = asset

  const leverage = coerceNumber(payload.leverage ?? payload.leverage_multiple)
  if (leverage !== undefined) trade.leverage = leverage

  const size = coerceNumber(payload.size ?? payload.notional)
  if (size !== undefined) trade.size = size

  const entry = coerceNumber(payload.entry ?? payload.entry_price)
  if (entry !== undefined) trade.entry = entry

  const stopLoss = coerceNumber(payload.stopLoss ?? payload.stop_loss)
  if (stopLoss !== undefined) trade.stopLoss = stopLoss

  const takeProfit = coerceNumber(payload.takeProfit ?? payload.take_profit)
  if (takeProfit !== undefined) trade.takeProfit = takeProfit

  const confidence = coerceNumber(payload.confidenceScore ?? payload.confidence_score ?? payload.confidence)
  if (confidence !== undefined) trade.confidenceScore = confidence

  const reasoning = coerceString(payload.reasoning ?? payload.rationale)
  if (reasoning) trade.reasoning = reasoning

  if (action !== 'NO_ACTION' && !trade.asset) {
    return null
  }

  return trade
}

function normalizeParsedResponseCandidate(payload: any): ParsedLLMResponse | null {
  if (!payload || typeof payload !== 'object') return null

  const headline = normalizeHeadlineBlock(payload.headline ?? payload.headlines ?? payload.summary)
  const overview = normalizeOverviewBlock(payload.overview ?? payload.analysis ?? payload.sections)
  const tradeActionsRaw = payload.tradeActions ?? payload.trade_actions ?? payload.actions

  const tradeActionsSource = Array.isArray(tradeActionsRaw)
    ? tradeActionsRaw
    : tradeActionsRaw && typeof tradeActionsRaw === 'object'
      ? [tradeActionsRaw]
      : []

  const tradeActions = tradeActionsSource
    .map(normalizeTradeActionPayload)
    .filter((action): action is LLMTradeAction => Boolean(action))

  if (!headline && !overview && tradeActions.length === 0) {
    return null
  }

  return {
    headline: headline ?? null,
    overview: overview ?? null,
    tradeActions,
  }
}

function normalizeParsedPayload(payload: any): ParsedLLMResponse | null {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload,
    payload.output,
    payload.result,
    payload.response,
  ].filter((candidate) => candidate && typeof candidate === 'object')

  for (const candidate of candidates) {
    const parsed = normalizeParsedResponseCandidate(candidate)
    if (parsed) {
      return parsed
    }
  }

  return null
}

function collectJsonCandidates(text: string): string[] {
  if (!text) return []
  const trimmed = text.trim()
  if (!trimmed) return []

  const candidates: string[] = []
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi

  let match: RegExpExecArray | null
  while ((match = fenceRegex.exec(trimmed)) !== null) {
    if (match[1]) {
      candidates.push(match[1].trim())
    }
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1).trim())
  }

  candidates.push(trimmed)

  return Array.from(new Set(candidates.filter(Boolean)))
}

export function parseStructuredLLMResponse(text: string): ParsedLLMResponse | null {
  const candidates = collectJsonCandidates(text)

  for (const candidate of candidates) {
    try {
      const parsedJson = JSON.parse(candidate)
      const structured = normalizeParsedPayload(parsedJson)
      if (structured) {
        return structured
      }
    } catch {
      continue
    }
  }

  return null
}

function normalizeAssetSymbol(asset?: string): string | null {
  if (!asset || typeof asset !== 'string') return null
  const sanitized = asset.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '')
  if (!sanitized) return null
  const token = sanitized.split(/[-_/]/).find((part) => part && part.length)
  return token ?? null
}

function deriveActionFromParsed(parsed?: ParsedLLMResponse | null): string {
  if (!parsed?.tradeActions?.length) {
    return 'NO_ACTION'
  }

  const prioritized =
    parsed.tradeActions.find((action) => action.action && action.action !== 'NO_ACTION') ??
    parsed.tradeActions[0]

  return buildLegacyActionString(prioritized)
}

function buildLegacyActionString(action?: LLMTradeAction | null): string {
  if (!action || !action.action) {
    return 'NO_ACTION'
  }

  if (action.action === 'NO_ACTION') {
    return 'NO_ACTION'
  }

  const assetSymbol = normalizeAssetSymbol(action.asset)
  if (!assetSymbol) {
    return 'NO_ACTION'
  }

  if (action.action === 'OPEN_LONG' || action.action === 'OPEN_SHORT') {
    const side = action.action === 'OPEN_LONG' ? 'LONG' : 'SHORT'
    const leverageSuffix =
      action.leverage && action.leverage > 1 ? `_${Math.round(action.leverage)}X` : ''
    return `OPEN_${side}_${assetSymbol}${leverageSuffix}`
  }

  if (action.action === 'CLOSE_LONG' || action.action === 'CLOSE_SHORT') {
    return `CLOSE_${assetSymbol}`
  }

  return 'NO_ACTION'
}

function parseLegacyActionText(text: string): string {
  if (!text) return 'NO_ACTION'
  let action = 'NO_ACTION'

  const actionJsonMatch = text.match(/ACTION_JSON:\s*({[^}]+})/s)
  if (actionJsonMatch) {
    try {
      const actionDetails = JSON.parse(actionJsonMatch[1])
      action = actionDetails.action || 'NO_ACTION'
    } catch (e) {
      console.error('Failed to parse ACTION_JSON:', e)
    }
  }

  if (action === 'NO_ACTION') {
    for (const pattern of LEGACY_ACTION_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        action = match[0]
        break
      }
    }
  }

  return action
}

export function buildLLMResponsePayload(
  text: string
): { parsed: ParsedLLMResponse | null; action: string } {
  const parsed = parseStructuredLLMResponse(text)
  if (parsed) {
    return { parsed, action: deriveActionFromParsed(parsed) }
  }

  return {
    parsed: null,
    action: parseLegacyActionText(text),
  }
}

export function parseActionFromText(text: string) {
  return buildLLMResponsePayload(text).action
}

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

    const text = data.candidates[0].content.parts[0].text
    const { parsed, action } = buildLLMResponsePayload(text)

    return {
      text,
      action,
      parsed,
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
  const { promptType, marketData, openPositions } = context

  const marketPricesText = (marketData || [])
    .map((m: any) => {
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
    PROMPT_TYPE: promptType,
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

  let userQuery = template.user_template ?? ''
  for (const [token, value] of Object.entries(replacements)) {
    userQuery = userQuery.replace(new RegExp(`{{${token}}}`, 'g'), value)
  }

  if (!userQuery.trim()) {
    userQuery =
      `Current Market State: ${marketPricesText}.\n\n` +
      `Open Positions: ${openPositionsText}.\n\n` +
      `Provide analysis and respond with the structured JSON payload (headline, overview, tradeActions).`
  }

  const systemInstruction = template.system_instruction ?? ''

  return { systemInstruction, userQuery }
}
