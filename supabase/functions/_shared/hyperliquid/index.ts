import * as hl from "@nktkas/hyperliquid";
import initSentry from "../../_shared/sentry.ts";
import { CandleData, HyperliquidOrderBody } from "./types.ts";
import { getTopKAssets } from "./utils.ts";

const Sentry = initSentry();

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
  return getTopKAssets(universe, assetContexts);
}

export async function getAccountSummary(userId: string, isTestnet: boolean): Promise<hl.ClearinghouseStateResponse> {
  return await infoClient(isTestnet).clearinghouseState({ user: userId })
}

export async function executeHyperliquidTrade(
  orderPayload: HyperliquidOrderBody,
  isTestnet: boolean,
  wallet: string
): Promise<{ success: boolean, orderId: string | null, message: string }> {
  Sentry.setContext("external_request", {
    requestBody: JSON.stringify(orderPayload),
  });

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
