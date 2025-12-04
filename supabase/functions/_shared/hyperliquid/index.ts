import * as hl from "@nktkas/hyperliquid";
import { CandleData, HyperliquidOrderBody } from "./types.ts";
import { getTopKAssets } from "./utils.ts";
import { recordExternalRequest } from "../lib/external_request.ts";

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

  const candles = await infoClient().candleSnapshot({
    coin: assetName,
    interval: intervalString,
    startTime,
    endTime,
  })

  recordExternalRequest({
    name: 'hyperliquid-candleSnapshot',
    url: 'hyperliquid/candleSnapshot',
    method: 'GET',
    requestBody: { assetName, intervalString, lookbackHours },
    responseBody: { count: candles.length },
  });

  return candles;
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
  recordExternalRequest({
    name: 'hyperliquid-metaAndAssetCtxs',
    url: 'hyperliquid/metaAndAssetCtxs',
    method: 'GET',
    responseBody: {
      universeCount: universe?.length ?? 0,
      assetContextCount: assetContexts?.length ?? 0,
    },
  });
  return getTopKAssets(universe, assetContexts);
}

export async function getAccountSummary(userId: string, isTestnet: boolean): Promise<hl.ClearinghouseStateResponse> {
  const response = await infoClient(isTestnet).clearinghouseState({ user: userId })

  recordExternalRequest({
    name: 'hyperliquid-clearinghouseState',
    url: 'hyperliquid/clearinghouseState',
    method: 'GET',
    requestBody: { userId, isTestnet },
    responseBody: {
      accountValue: response?.userState?.marginSummary?.accountValue,
    },
  });

  return response;
}

export async function executeHyperliquidTrade(
  orderPayload: HyperliquidOrderBody,
  isTestnet: boolean,
  wallet: string
): Promise<{ success: boolean, orderId: string | null, message: string }> {
  const orderResult = await exchangeClient(wallet, isTestnet).order(orderPayload.action)

  recordExternalRequest({
    name: 'hyperliquid-order',
    url: 'hyperliquid/order',
    method: 'POST',
    requestBody: orderPayload,
    responseBody: orderResult,
    statusText: orderResult.status,
  });

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
