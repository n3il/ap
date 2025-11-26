import type HyperliquidTypes from '@nktkas/hyperliquid'

const TRACKED_ASSETS = ['BTC', 'ETH', 'SOL', 'ARB', 'OP', 'AVAX', 'MATIC', 'DOGE', 'SUI']

type HyperliquidModule = typeof HyperliquidTypes

let hyperliquidModulePromise: Promise<HyperliquidModule> | null = null
let transportPromise: Promise<InstanceType<HyperliquidModule['HttpTransport']>> | null = null
let infoClientPromise: Promise<InstanceType<HyperliquidModule['InfoClient']>> | null = null
let assetMapPromise: Promise<Map<string, { index: number; szDecimals: number }>> | null = null

const hyperliquidNetwork = (Deno.env.get('HYPERLIQUID_NETWORK') ?? '').toLowerCase()
const hyperliquidApiUrl = Deno.env.get('HYPERLIQUID_API_URL')
const hyperliquidRpcUrl = Deno.env.get('HYPERLIQUID_RPC_URL')

export interface MarketData {
  asset: string
  price: number
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
  orderId?: number
  price?: number
  message?: string
  error?: string
}

async function loadHyperliquidModule(): Promise<HyperliquidModule> {
  if (!hyperliquidModulePromise) {
    hyperliquidModulePromise = import('npm:@nktkas/hyperliquid')
  }
  return hyperliquidModulePromise
}

async function getTransport() {
  if (!transportPromise) {
    transportPromise = (async () => {
      const hl = await loadHyperliquidModule()
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
      const hl = await loadHyperliquidModule()
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
  try {
    const infoClient = await getInfoClient()
    const assetSymbol = asset.replace('-PERP', '')

    const endTime = Date.now()
    const startTime = endTime - (lookbackHours * 60 * 60 * 1000)

    // Convert interval to seconds for API
    const intervalSeconds = intervalMinutes * 60

    console.log(`Fetching ${intervalMinutes}m candles for ${assetSymbol} from last ${lookbackHours}h`)

    const candles = await infoClient.candleSnapshot({
      coin: assetSymbol,
      interval: `${intervalMinutes}m`,
      startTime,
      endTime,
    })

    if (!candles || candles.length === 0) {
      console.log(`No candle data returned for ${assetSymbol}`)
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
  } catch (error) {
    console.error(`Error fetching candle data for ${asset}:`, error)
    return []
  }
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
    const asset = `${symbol}-PERP`
    const candles = await fetchCandleData(asset, intervalMinutes, lookbackHours)
    return { asset, candles }
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
  try {
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
      const fundingChange = ctx?.funding ? parseFloat(ctx.funding) * 100 : 0

      results.push({
        asset: `${symbol}-PERP`,
        price: parseFloat(mid),
        change_24h: fundingChange,
        funding_rate: ctx?.funding ? parseFloat(ctx.funding) : undefined,
        volume_24h: ctx?.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : undefined,
        open_interest: ctx?.openInterest ? parseFloat(ctx.openInterest) : undefined,
      })
    }

    return results
  } catch (error) {
    console.error('Error fetching Hyperliquid market data:', error)
    return []
  }
}

/**
 * Get current position for an asset
 */
export async function getPosition(address: string, asset: string) {
  try {
    const infoClient = await getInfoClient()
    const data = await infoClient.webData2({ user: address })
    const baseAsset = asset.replace('-PERP', '')
    const position = data.clearinghouseState.assetPositions?.find(
      (entry: any) => entry.position.coin === baseAsset
    )
    return position ?? null
  } catch (error) {
    console.error('Error fetching position:', error)
    return null
  }
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

  try {
    const [hl, infoClient] = await Promise.all([loadHyperliquidModule(), getInfoClient()])
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
  } catch (error) {
    console.error('Error executing trade:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
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

  try {
    const position = await getPosition(hyperliquidAddress, asset)
    if (!position) {
      return {
        success: false,
        error: `No open position found for ${asset}`,
      }
    }

    const [hl, infoClient] = await Promise.all([loadHyperliquidModule(), getInfoClient()])
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
