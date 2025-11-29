import * as hl from "@nktkas/hyperliquid";

import type { MarketAsset } from '../lib/types.ts'
import type { LLMTradeAction } from "../llm/types.ts";

type CandleInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M'

// const hyperliquidNetwork = (Deno.env.get('HYPERLIQUID_NETWORK') ?? '').toLowerCase()
// const hyperliquidApiUrl = Deno.env.get('HYPERLIQUID_API_URL')
// const hyperliquidRpcUrl = Deno.env.get('HYPERLIQUID_RPC_URL')

 // Accepts optional parameters (e.g. isTestnet, timeout, etc.)
export const getInfoClient = async () => {
  const httpTransport = new hl.HttpTransport({
    isTestnet: true
  });
  return await new hl.InfoClient({
    transport: httpTransport,
  })
};


export async function fetchTradeableAssets(): Promise<MarketAsset[]> {
  const infoClient = await getInfoClient()

  const meta = await infoClient.meta()
  const assets = meta.universe.map((asset: any) => ({
    symbol: asset.name,
    index: asset.index,
    szDecimals: asset.szDecimals ?? 3,
  }))

  return assets
}

/**
 * Fetch 5-minute candle data for the last 3 hours for a specific asset
 */
export async function fetchCandleData({
  assetId,
  intervalString = "5m",
  lookbackHours = 3,
}: {
  asset: string,
  intervalString?: CandleInterval,
  lookbackHours?: number,
}): Promise<CandleData[]> {
  const infoClient = await getInfoClient()

  const endTime = Date.now()
  const startTime = endTime - (lookbackHours * 60 * 60 * 1000)

  const candles = await infoClient.candleSnapshot({
    coin: asset,
    interval: intervalString,
    startTime,
    endTime,
  })

  if (!candles || candles.length === 0) {
    console.warn(`No candle data returned for ${assetId}`)
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

export async function getPosition(address: string, asset: string) {
  const infoClient = await getInfoClient()
  const data = await infoClient.webData2({ user: address })
  const baseAsset = asset.replace('-PERP', '')
  const position = data.clearinghouseState.assetPositions?.find(
    (entry: any) => entry.position.coin === baseAsset
  )
  return position ?? null
}

export async function executeHyperliquidTrade(
  action: LLMTradeAction,
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

  // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
  const orderResult = await exchangeClient.order({
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: formatNumber(finalLimitPrice, 6),
        s: formatNumber(quantity, assetInfo.szDecimals ?? 4),
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
      price: finalLimitPrice,
      quantity,
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
  new hl.ExchangeClient({ wallet, transport })
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
