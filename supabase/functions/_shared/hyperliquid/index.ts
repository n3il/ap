import * as hl from "@nktkas/hyperliquid";

import { CandleData, HyperliquidOrderBody } from "./types.ts";

type CandleInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M'

const infoClient = (isTestnet = true) => {
  const httpTransport = new hl.HttpTransport({
    isTestnet
  });
  return new hl.InfoClient({
    transport: httpTransport,
  })
};

const exchangeClient = (wallet: string, isTestnet = true, ) => {
  const httpTransport = new hl.HttpTransport({
    isTestnet
  });
  return new hl.ExchangeClient({
    wallet,
    transport: httpTransport,
  })
};

export async function fetchCandleData({
  assetName,
  intervalString = "5m",
  lookbackHours = 3,
}: {
  assetName: string,
  intervalString?: CandleInterval,
  lookbackHours?: number,
}): Promise<CandleData[]> {
  const endTime = Date.now()
  const startTime = endTime - (lookbackHours * 60 * 60 * 1000)

  return await infoClient().candleSnapshot({
    coin: assetName,
    interval: intervalString,
    startTime,
    endTime,
  })
}

export async function fetchAllCandleData({
  assetNames,
  intervalString = "5m",
  lookbackHours = 3,
}: {
  assetNames: string[];
  intervalString?: CandleInterval;
  lookbackHours?: number;
}) {
  return await Promise.all(
    assetNames.map((asset) => fetchCandleData({ assetName: asset, intervalString, lookbackHours }))
  )
}

export async function fetchTradeableAssets()  {
  const [{universe}, assetContexts] = await infoClient(true).metaAndAssetCtxs()

  return universe
    .map((u, i) => ({ assetData: u, ctx: assetContexts[i], assetId: i }))
    .sort((a, b) => (parseFloat(a.ctx.dayNtlVlm)) - parseFloat(b.ctx.dayNtlVlm))
    .slice(10)
    .map(({assetData, ctx, assetId}: any) => {
      return {
        "Ticker": assetData.name,
        "Sz-Decimals": assetData.szDecimals,
        "Max-Leverage": assetData.maxLeverage,
        "Day-Ntl-Vlm": ctx.dayNtlVlm,
        "Funding": ctx.funding,
        "Impact-Pxs": ctx.impactPxs,
        "Mark-Px": ctx.markPx,
        "Mid-Px": ctx.midPx,
        "Open-Interest": ctx.openInterest,
        "Oracle-Px": ctx.oraclePx,
        "Premium": ctx.premium,
        "Prev-Day-Px": ctx.prevDayPx,
        "Asset-Id": assetId

        // "dayNtlVlm":"1169046.29406",
        // "funding":"0.0000125",
        // "impactPxs":[ "14.3047", "14.3444"],
        // "markPx":"14.3161",
        // "midPx":"14.314",
        // "openInterest":"688.11",
        // "oraclePx":"14.32",
        // "premium":"0.00031774",
        // "prevDayPx":"15.322"
      }
    })
}

export async function getAccountSummary(userId: string, isTestnet: boolean): Promise<hl.ClearinghouseStateResponse> {
  return await infoClient(isTestnet).clearinghouseState({ user: userId })
}

export async function executeHyperliquidTrade(
  orderPayload: HyperliquidOrderBody,
  isTestnet: boolean,
  wallet: string
): Promise<{ success: boolean, orderId: string | null, message: string }> {
  const orderResult = await exchangeClient(wallet, isTestnet).order(orderPayload.action)

  const status = orderResult.response?.data?.statuses?.[0]
  if (orderResult.status === 'ok' && status) {
    const resting = (status as any).resting
    const oid = resting?.oid ?? null
    return {
      success: true,
      orderId: oid ?? undefined,
      message: 'Trade executed successfully',
    }
  }

  return {
    success: false,
    orderId: null,
    message: `Order failed: ${JSON.stringify(orderResult)}`,
  }
}
