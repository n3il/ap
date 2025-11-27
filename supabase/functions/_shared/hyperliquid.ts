import * as hl from "@nktkas/hyperliquid";
import type { MarketAsset } from './lib/types.ts'

type CandleInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M'

const INTERVAL_MINUTES_TO_STRING: Record<number, CandleInterval> = {
  1: '1m',
  3: '3m',
  5: '5m',
  15: '15m',
  30: '30m',
  60: '1h',
  120: '2h',
  240: '4h',
  480: '8h',
  720: '12h',
  1440: '1d',
  4320: '3d',
  10080: '1w',
  43200: '1M',
}

const DEFAULT_CANDLE_INTERVAL: CandleInterval = '5m'

type HyperliquidModule = {
  HttpTransport: new (options?: Record<string, unknown>) => unknown
  InfoClient: new (options: { transport: unknown }) => {
    candleSnapshot(args: {
      coin: string
      interval: CandleInterval
      startTime: number
      endTime: number
    }): Promise<any[]>
    meta(): Promise<{ universe: Array<{ name: string; szDecimals?: number }> }>
    metaAndAssetCtxs(): Promise<[unknown, Array<Record<string, unknown>>]>
    allMids(): Promise<Record<string, string>>
    webData2(params: { user: string }): Promise<any>
  }
  ExchangeClient: new (options: { wallet: string; transport: unknown }) => {
    order(args: unknown): Promise<any>
  }
}

const TRACKED_ASSETS = ['BTC', 'ETH', 'SOL', 'ARB', 'OP', 'AVAX', 'MATIC', 'DOGE', 'SUI']
const HYPERLIQUID_MODULE_SPECIFIER = 'npm:@nktkas/' + 'hyperliquid'

let hyperliquidModulePromise: Promise<HyperliquidModule> | null = null
let transportPromise: Promise<unknown> | null = null
type InfoClientInstance = InstanceType<HyperliquidModule['InfoClient']>
let infoClientPromise: Promise<InfoClientInstance> | null = null
let assetMapPromise: Promise<Map<string, { index: number; szDecimals: number }>> | null = null

const hyperliquidNetwork = (Deno.env.get('HYPERLIQUID_NETWORK') ?? '').toLowerCase()
const hyperliquidApiUrl = Deno.env.get('HYPERLIQUID_API_URL')
const hyperliquidRpcUrl = Deno.env.get('HYPERLIQUID_RPC_URL')

export interface MarketData extends MarketAsset {
  change_24h: number
  funding_rate?: number
  volume_24h?: number
  open_interest?: number
}

export interface CandleData {
  time: number // timestamp in ms
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TradeAction {
  action: string
  asset?: string
  side?: 'LONG' | 'SHORT'
  size?: number
  leverage?: number
}

export interface TradeResult {
  success: boolean
  orderId?: string | number
  price?: number
  message?: string
  error?: string
  fee?: number
}

async function getTransport() {
  if (!transportPromise) {
    transportPromise = (async () => {
      const options: Record<string, unknown> = {}

      if (hyperliquidNetwork === 'testnet') {
        options.isTestnet = true
      }

      const serverOverrides: Record<string, unknown> = {}
      if (hyperliquidApiUrl || hyperliquidRpcUrl) {
        serverOverrides.mainnet = {
          ...(hyperliquidApiUrl ? { api: hyperliquidApiUrl } : {}),
          ...(hyperliquidRpcUrl ? { rpc: hyperliquidRpcUrl } : {}),
        }
      }
      if (Object.keys(serverOverrides).length) {
        options.server = serverOverrides
      }

      return new hl.HttpTransport(options)
    })()
  }
  return transportPromise
}

async function getInfoClient() {
  if (!infoClientPromise) {
    infoClientPromise = (async () => {
      const transport = await getTransport()
      return new hl.InfoClient({ transport })
    })()
  }
  return infoClientPromise
}

async function getAssetMap(): Promise<Map<string, { index: number; szDecimals: number }>> {
  if (!assetMapPromise) {
    assetMapPromise = (async () => {
      const infoClient = await getInfoClient()
      const meta = await infoClient.meta()
      const map = new Map<string, { index: number; szDecimals: number }>()
      meta.universe.forEach((asset: any, idx: number) => {
        map.set(asset.name, { index: idx, szDecimals: asset.szDecimals ?? 3 })
      })
      return map
    })()
  }
  return assetMapPromise
}

function formatNumber(value: number, decimals = 6) {
  const fixed = value.toFixed(decimals)
  return fixed.replace(/\.?0+$/, '')
}

function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

async function resolveAssetInfo(symbol: string) {
  const assetKey = symbol.toUpperCase()
  let assetMap = await getAssetMap()
  let info = assetMap.get(assetKey)
  if (!info) {
    assetMapPromise = null
    assetMap = await getAssetMap()
    info = assetMap.get(assetKey)
  }
  if (!info) {
    throw new Error(`Unknown Hyperliquid asset: ${assetKey}`)
  }
  return info
}

function normalizePrivateKey(key: string) {
  return key.startsWith('0x') ? key : `0x${key}`
}

/**
 * Fetch 5-minute candle data for the last 3 hours for a specific asset
 */
export async function fetchCandleData(
  asset: string,
  intervalMinutes = 5,
  lookbackHours = 3
): Promise<CandleData[]> {
  const infoClient = await getInfoClient()
  const intervalString = INTERVAL_MINUTES_TO_STRING[intervalMinutes] ?? DEFAULT_CANDLE_INTERVAL

  if (!INTERVAL_MINUTES_TO_STRING[intervalMinutes]) {
    console.warn(
      `Unsupported interval ${intervalMinutes}m requested. Falling back to ${intervalString}.`
    )
  }

  const endTime = Date.now()
  const startTime = endTime - (lookbackHours * 60 * 60 * 1000)

  // Convert interval to seconds for API
  const intervalSeconds = intervalMinutes * 60

  console.log(`Fetching ${intervalMinutes}m candles for ${asset} from last ${lookbackHours}h`)

  const candles = await infoClient.candleSnapshot({
    coin: asset,
    interval: intervalString,
    startTime,
    endTime,
  })

  if (!candles || candles.length === 0) {
    console.log(`No candle data returned for ${asset}`)
    return []
  }

  return candles.map((c: any) => ({
    time: c.t ?? c.T ?? 0,
    open: parseFloat(c.o ?? 0),
    high: parseFloat(c.h ?? 0),
    low: parseFloat(c.l ?? 0),
    close: parseFloat(c.c ?? 0),
    volume: parseFloat(c.v ?? 0),
  }))
}

/**
 * Fetch 5-minute candle data for all tracked assets for the last 3 hours
 */
export async function fetchAllCandleData(
  intervalMinutes = 5,
  lookbackHours = 3,
  tickers = TRACKED_ASSETS
): Promise<Record<string, CandleData[]>> {
  console.log(`Fetching ${intervalMinutes}m candles for all tracked assets`)

  const candleDataMap: Record<string, CandleData[]> = {}

  // Fetch candles for all tracked assets in parallel
  const candlePromises = tickers.map(async (symbol) => {
    const candles = await fetchCandleData(symbol, intervalMinutes, lookbackHours)
    return { asset: symbol, candles }
  })

  const results = await Promise.allSettled(candlePromises)

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      candleDataMap[result.value.asset] = result.value.candles
    } else {
      console.error(`Failed to fetch candles for ${tickers[idx]}:`, result.reason)
      candleDataMap[`${tickers[idx]}-PERP`] = []
    }
  })

  return candleDataMap
}

/**
 * Fetch real-time market data from Hyperliquid using the official SDK
 */
export async function fetchHyperliquidMarketData(): Promise<MarketData[]> {
  console.log('Fetching Hyperliquid market data...')
  const infoClient = await getInfoClient()

  const allMids = await infoClient.allMids()
  const [, assetContexts] = await infoClient.metaAndAssetCtxs()

  const results: MarketData[] = []
  for (const symbol of TRACKED_ASSETS) {
    const mid = allMids[symbol]
    if (!mid) {
      console.log(`No price data for ${symbol}`)
      continue
    }

    const ctx = assetContexts?.find((entry: any) => entry.coin === symbol)
    const fundingValue = parseNumericValue(ctx?.funding)
    const volumeValue = parseNumericValue(ctx?.dayNtlVlm)
    const openInterestValue = parseNumericValue(ctx?.openInterest)
    const fundingChange = typeof fundingValue === 'number' ? fundingValue * 100 : 0

    results.push({
      symbol: `${symbol}-PERP`,
      price: parseFloat(mid),
      change_24h: fundingChange,
      funding_rate: fundingValue,
      volume_24h: volumeValue,
      open_interest: openInterestValue,
    })
  }

  return results
}

/**
 * Get current position for an asset
 */
export async function getPosition(address: string, asset: string) {
  const infoClient = await getInfoClient()
  const data = await infoClient.webData2({ user: address })
  const baseAsset = asset.replace('-PERP', '')
  const position = data.clearinghouseState.assetPositions?.find(
    (entry: any) => entry.position.coin === baseAsset
  )
  return position ?? null
}

/**
 * Execute a trade on Hyperliquid using the official SDK
 *
 * IMPORTANT: Requires HYPERLIQUID_PRIVATE_KEY environment variable
 * WARNING: Only use in production with proper security measures
 */
export async function executeHyperliquidTrade(
  action: TradeAction,
  hyperliquidAddress: string
): Promise<TradeResult> {
  console.log('Executing Hyperliquid trade:', { action, address: hyperliquidAddress })

  const privateKey = Deno.env.get('HYPERLIQUID_PRIVATE_KEY')
  if (!privateKey) {
    return {
      success: false,
      error: "HYPERLIQUID_PRIVATE_KEY not set"
    }
  }

  if (!action.asset || !action.side) {
    return {
      success: false,
      error: 'Invalid trade action payload',
    }
  }

  const infoClient = await getInfoClient()
  const transport = await getTransport()
  const wallet = normalizePrivateKey(privateKey)
  const exchangeClient = new hl.ExchangeClient({ wallet, transport })

  const assetSymbol = action.asset.replace('-PERP', '')
  const assetInfo = await resolveAssetInfo(assetSymbol)
  const size = action.size ?? 0.01
  const isBuy = action.side === 'LONG'

  const allMids = await infoClient.allMids()
  const currentPriceRaw = allMids[assetSymbol]
  if (!currentPriceRaw) {
    throw new Error(`No price available for ${assetSymbol}`)
  }
  const currentPrice = parseFloat(currentPriceRaw)
  const slippage = 0.001
  const limitPrice = isBuy
    ? currentPrice * (1 + slippage)
    : currentPrice * (1 - slippage)

  console.log(`Placing order: ${action.side} ${size} ${assetSymbol} @ ${limitPrice}`)

  // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
  const orderResult = await exchangeClient.order({
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: formatNumber(limitPrice, 6),
        s: formatNumber(size, assetInfo.szDecimals ?? 4),
        r: false,
        t: { limit: { tif: 'Ioc' as const } },
      },
    ],
    grouping: 'na',
  })

  const status = orderResult.response?.data?.statuses?.[0]
  if (orderResult.status === 'ok' && status) {
    const resting = (status as any).resting
    const oid = resting?.oid ?? null
    return {
      success: true,
      orderId: oid ?? undefined,
      price: limitPrice,
      message: 'Trade executed successfully',
    }
  }

  return {
    success: false,
    error: `Order failed: ${JSON.stringify(orderResult)}`,
  }
}

/**
 * Close an existing position
 */
export async function closePosition(
  asset: string,
  hyperliquidAddress: string
): Promise<TradeResult> {
  const privateKey = Deno.env.get('HYPERLIQUID_PRIVATE_KEY')
  if (!privateKey) {
    return {
      success: false,
      error: "HYPERLIQUID_PRIVATE_KEY not set"
    }
  }

  const position = await getPosition(hyperliquidAddress, asset)
  if (!position) {
    return {
      success: false,
      error: `No open position found for ${asset}`,
    }
  }

  const infoClient = await getInfoClient()
  const transport = await getTransport()
  const wallet = normalizePrivateKey(privateKey)
  const exchangeClient = new hl.ExchangeClient({ wallet, transport })

  const assetSymbol = asset.replace('-PERP', '')
  const assetInfo = await resolveAssetInfo(assetSymbol)

  const currentSize = Math.abs(parseFloat(position.position.szi))
  const isLong = parseFloat(position.position.szi) > 0

  const allMids = await infoClient.allMids()
  const currentPriceRaw = allMids[assetSymbol]
  if (!currentPriceRaw) {
    throw new Error(`No price available for ${assetSymbol}`)
  }
  const currentPrice = parseFloat(currentPriceRaw)
  const slippage = 0.001
  const limitPrice = isLong
    ? currentPrice * (1 - slippage)
    : currentPrice * (1 + slippage)

  console.log(`Closing ${isLong ? 'LONG' : 'SHORT'} ${currentSize} ${assetSymbol} @ ${limitPrice}`)

  const orderResult = await exchangeClient.order({
    orders: [
      {
        a: assetInfo.index,
        b: !isLong,
        p: formatNumber(limitPrice, 6),
        s: formatNumber(currentSize, assetInfo.szDecimals ?? 4),
        r: true,
        t: { limit: { tif: 'Ioc' as const } },
      },
    ],
    grouping: 'na',
  })

  const status = orderResult.response?.data?.statuses?.[0]
  if (orderResult.status === 'ok' && status) {
    const resting = (status as any).resting
    const oid = resting?.oid ?? null
    return {
      success: true,
      orderId: oid ?? undefined,
      price: limitPrice,
      message: 'Position closed successfully',
    }
  }

  return {
    success: false,
    error: `Close order failed: ${JSON.stringify(orderResult)}`,
  }
}
