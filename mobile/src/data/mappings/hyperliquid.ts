import type * as hl from "@nktkas/hyperliquid";
import type {
  AllMidsResponse,
  CandleSnapshotResponse,
  ClearinghouseStateResponse,
  MetaAndAssetCtxsResponse,
  PortfolioResponse,
  UserFillsResponse,
} from "@nktkas/hyperliquid/api/info";
import type {
  AllMidsEvent,
  CandleEvent,
  ClearinghouseStateEvent,
} from "@nktkas/hyperliquid/api/subscription";

type NullableNumber = number | null;

const toNumber = (value: unknown): NullableNumber => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// ---------------------------------------------
// Candles
// ---------------------------------------------
type CandleSnapshotPoint =
  | CandleSnapshotResponse[number]
  | Awaited<ReturnType<hl.InfoClient["candleSnapshot"]>>[number];
type CandleWsEvent =
  | CandleEvent
  | (Parameters<hl.SubscriptionClient["candle"]>[1] extends (
      data: infer E,
      ...args: any[]
    ) => void
      ? E
      : never);
type CandleInput =
  | CandleSnapshotPoint
  | CandleWsEvent
  | Record<string, unknown>;

export type MarketCandle = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  trades?: number;
};

export const mapHyperliquidCandle = (
  point: CandleInput | null | undefined,
): MarketCandle | null => {
  const rawTimestamp = toNumber(point?.t ?? point?.timestamp);
  const open = toNumber(point?.o ?? point?.open);
  const close = toNumber(point?.c ?? point?.close);
  const high = toNumber(point?.h ?? point?.high);
  const low = toNumber(point?.l ?? point?.low);

  if (
    rawTimestamp === null ||
    open === null ||
    close === null ||
    high === null ||
    low === null
  ) {
    return null;
  }

  const timestamp = rawTimestamp;

  const volume = toNumber(point?.v ?? point?.volume);
  const trades = toNumber(point?.n ?? point?.trades);

  return {
    timestamp,
    open,
    close,
    high,
    low,
    volume: volume ?? undefined,
    trades: trades ?? undefined,
  };
};

// ---------------------------------------------
// Market meta + contexts
// ---------------------------------------------
type MetaAndCtxPayload =
  | MetaAndAssetCtxsResponse
  | Awaited<ReturnType<hl.InfoClient["metaAndAssetCtxs"]>>
  | null;

export type MarketAssetSnapshot = {
  symbol: string;
  assetId: number | null;
  sizeDecimals: number | null;
  maxLeverage: number | null;
  dayNotionalVolume: number | null;
  fundingRate: number | null;
  impactPrices: [number, number] | null;
  markPrice: number | null;
  midPrice: number | null;
  openInterest: number | null;
  oraclePrice: number | null;
  premium: number | null;
  previousDayPrice: number | null;
  price?: number | null;
  lastUpdated?: number;
};

export const mapHyperliquidMetaAndAssetCtxs = (
  payload: MetaAndCtxPayload,
): MarketAssetSnapshot[] => {
  if (!Array.isArray(payload) || payload.length < 2) return [];

  const [metaRaw, ctxsRaw] = payload as NonNullable<MetaAndCtxPayload>;
  const universe = Array.isArray(metaRaw?.universe) ? metaRaw.universe : [];
  const contexts = Array.isArray(ctxsRaw) ? ctxsRaw : [];

  return universe
    .map((asset, index) => {
      const ctx = contexts[index] ?? {};
      const symbol = String(asset?.name ?? asset?.ticker ?? "")
        .toUpperCase()
        .trim();
      if (!symbol) return null;

      const impactA = toNumber(ctx?.impactPxs?.[0]);
      const impactB = toNumber(ctx?.impactPxs?.[1]);
      const impactPrices =
        impactA !== null && impactB !== null
          ? ([impactA, impactB] as [number, number])
          : null;

      return {
        symbol,
        assetId: toNumber(asset?.index ?? index),
        sizeDecimals: toNumber(asset?.szDecimals),
        maxLeverage: toNumber(asset?.maxLeverage),
        dayNotionalVolume: toNumber(ctx?.dayNtlVlm),
        fundingRate: toNumber(ctx?.funding),
        impactPrices,
        markPrice: toNumber(ctx?.markPx),
        midPrice: toNumber(ctx?.midPx),
        price: toNumber(ctx?.midPx),
        openInterest: toNumber(ctx?.openInterest),
        oraclePrice: toNumber(ctx?.oraclePx),
        premium: toNumber(ctx?.premium),
        previousDayPrice: toNumber(ctx?.prevDayPx),
      };
    })
    .filter((asset): asset is MarketAssetSnapshot =>
      Boolean(asset && asset.symbol && asset.symbol.length > 0),
    );
};

// ---------------------------------------------
// Mid price streaming
// ---------------------------------------------
export type MarketMidsUpdate = {
  mids: Record<string, number>;
  asOf: number;
  isSnapshot: boolean;
};

export const mapHyperliquidMids = (
  message:
    | AllMidsEvent
    | {
        data?: { mids?: AllMidsResponse };
        mids?: AllMidsResponse;
        isSnapshot?: boolean;
        timestamp?: number;
      }
    | null
    | undefined,
): MarketMidsUpdate | null => {
  const midsRaw = (message as any)?.data?.mids ?? (message as any)?.mids;
  if (!midsRaw || typeof midsRaw !== "object") return null;

  const mids = Object.entries(midsRaw).reduce<Record<string, number>>(
    (acc, [symbol, value]) => {
      const num = toNumber(value);
      if (num !== null) {
        acc[String(symbol).toUpperCase()] = num;
      }
      return acc;
    },
    {},
  );

  if (!Object.keys(mids).length) return null;

  return {
    mids,
    asOf: message?.timestamp ? Number(message.timestamp) : Date.now(),
    isSnapshot: Boolean(message?.isSnapshot),
  };
};

// ---------------------------------------------
// User fills / trades
// ---------------------------------------------
export type UserFill = {
  symbol: string;
  side: "BUY" | "SELL";
  price: NullableNumber;
  size: NullableNumber;
  timestamp: NullableNumber;
  txHash?: string;
  tradeId?: number;
  startPosition?: NullableNumber;
  direction?: string | null;
  closedPnl?: NullableNumber;
  fee?: NullableNumber;
  orderId?: number;
  crossed?: boolean;
  feeToken?: string | null;
};

type UserFillsPayload =
  | UserFillsResponse
  | Awaited<ReturnType<hl.InfoClient["userFills"]>>
  | null;

export const mapHyperliquidFills = (payload: UserFillsPayload): UserFill[] => {
  if (!Array.isArray(payload)) return [];

  return (payload as any[])
    .map((raw) => {
      const symbol = String(raw?.coin ?? raw?.symbol ?? "").toUpperCase();
      if (!symbol) return null;

      const timestamp = toNumber(raw?.time);
      const normalizedTime =
        timestamp !== null && timestamp < 1e12 ? timestamp * 1000 : timestamp;

      const sideRaw = String(raw?.side ?? raw?.direction ?? "").toUpperCase();
      const side: UserFill["side"] =
        sideRaw === "B" || sideRaw === "BUY" ? "BUY" : "SELL";

      return {
        symbol,
        side,
        price: toNumber(raw?.px ?? raw?.price),
        size: toNumber(raw?.sz ?? raw?.size),
        timestamp: normalizedTime,
        txHash: raw?.hash,
        tradeId: Number.isFinite(Number(raw?.tid))
          ? Number(raw?.tid)
          : undefined,
        startPosition: toNumber(raw?.startPosition),
        direction: raw?.dir ?? null,
        closedPnl: toNumber(raw?.closedPnl),
        fee: toNumber(raw?.fee),
        orderId: Number.isFinite(Number(raw?.oid))
          ? Number(raw?.oid)
          : undefined,
        crossed: Boolean(raw?.crossed),
        feeToken: raw?.feeToken ?? null,
      };
    })
    .filter((fill): fill is UserFill => Boolean(fill));
};

// ---------------------------------------------
// Portfolio history
// ---------------------------------------------
export type AccountValuePoint = { timestamp: number; value: number };
export type PortfolioTimeframe = {
  timeframe: string;
  accountValueHistory: AccountValuePoint[];
};

type PortfolioPayload =
  | PortfolioResponse
  | Awaited<ReturnType<hl.InfoClient["portfolio"]>>
  | null;

const normalizeAccountValueHistory = (series: unknown): AccountValuePoint[] => {
  if (!Array.isArray(series)) return [];

  return (series as Array<[unknown, unknown]>)
    .map(([timestampRaw, valueRaw]) => {
      const timestamp = toNumber(timestampRaw);
      const value = toNumber(valueRaw);
      if (timestamp === null || value === null) return null;
      return { timestamp, value };
    })
    .filter((point): point is AccountValuePoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const mapHyperliquidPortfolio = (
  payload: PortfolioPayload,
): PortfolioTimeframe[] => {
  if (!Array.isArray(payload)) return [];

  return (payload as Array<[unknown, any]>)
    .map(([timeframeRaw, summary]) => {
      const timeframe = String(timeframeRaw ?? "").toLowerCase();
      if (!timeframe) return null;

      return {
        timeframe,
        accountValueHistory: normalizeAccountValueHistory(
          summary?.accountValueHistory ?? [],
        ),
        pnlHistory: normalizeAccountValueHistory(
          summary?.pnlHistory ?? [],
        ),
      };
    })
    .filter((entry): entry is PortfolioTimeframe =>
      Boolean(entry && entry.timeframe && entry.accountValueHistory),
    );
};

// ---------------------------------------------
// Clearinghouse state
// ---------------------------------------------
type ClearinghouseInfoPayload =
  | ClearinghouseStateResponse
  | Awaited<ReturnType<hl.InfoClient["clearinghouseState"]>>;
type ClearinghouseWsEvent =
  | ClearinghouseStateEvent
  | (Parameters<hl.SubscriptionClient["clearinghouseState"]>[1] extends (
      data: infer E,
      ...args: any[]
    ) => void
      ? E
      : never);
type ClearinghousePayload =
  | ClearinghouseInfoPayload
  | ClearinghouseWsEvent
  | null
  | undefined;

export type FundingBreakdown = {
  allTime: NullableNumber;
  sinceChange: NullableNumber;
  sinceOpen: NullableNumber;
};

export type MarginSummary = {
  accountValue: NullableNumber;
  totalMarginUsed: NullableNumber;
  totalNotional: NullableNumber;
  totalRawUsd: NullableNumber;
};

export type PositionSnapshot = {
  symbol: string;
  type: string;
  size: number;
  entryPrice: number;
  liquidationPrice: NullableNumber;
  marginUsed: NullableNumber;
  maxLeverage: NullableNumber;
  notionalValue: NullableNumber;
  returnOnEquity: NullableNumber;
  unrealizedPnl: NullableNumber;
  leverage: {
    mode: string;
    notional: NullableNumber;
    multiple: NullableNumber;
  };
  funding: FundingBreakdown;
};

export type ClearinghouseSnapshot = {
  positions: PositionSnapshot[];
  crossMaintenanceMarginUsed: NullableNumber;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  timestamp: NullableNumber;
  withdrawable: NullableNumber;
};

const normalizeFunding = (fundingRaw: any): FundingBreakdown => ({
  allTime: toNumber(fundingRaw?.allTime),
  sinceChange: toNumber(fundingRaw?.sinceChange),
  sinceOpen: toNumber(fundingRaw?.sinceOpen),
});

const normalizeMarginSummary = (summaryRaw: any): MarginSummary => ({
  accountValue: toNumber(summaryRaw?.accountValue),
  totalMarginUsed: toNumber(summaryRaw?.totalMarginUsed),
  totalNotional: toNumber(summaryRaw?.totalNtlPos ?? summaryRaw?.totalNotional),
  totalRawUsd: toNumber(summaryRaw?.totalRawUsd),
});

export const mapHyperliquidClearinghouseState = (
  payload: ClearinghousePayload,
): ClearinghouseSnapshot | null => {
  if (!payload) return null;

  const positions = Array.isArray(payload?.assetPositions)
    ? payload.assetPositions
    : [];

  const normalizedPositions: PositionSnapshot[] = positions
    .map((assetPosition) => {
      const p = assetPosition?.position ?? {};
      const symbol = String(p?.coin ?? "").toUpperCase();
      if (!symbol) return null;

      return {
        symbol,
        type: String(assetPosition?.type ?? "unknown"),
        size: toNumber(p?.szi) ?? 0,
        entryPrice: toNumber(p?.entryPx) ?? 0,
        liquidationPrice: toNumber(p?.liquidationPx),
        marginUsed: toNumber(p?.marginUsed),
        maxLeverage: toNumber(p?.maxLeverage),
        notionalValue: toNumber(p?.positionValue),
        returnOnEquity: toNumber(p?.returnOnEquity),
        unrealizedPnl: toNumber(p?.unrealizedPnl),
        leverage: {
          mode: String(p?.leverage?.type ?? p?.leverage?.mode ?? "cross"),
          notional: toNumber(p?.leverage?.rawUsd),
          multiple: toNumber(p?.leverage?.value),
        },
        funding: normalizeFunding(p?.cumFunding),
      };
    })
    .filter((p): p is PositionSnapshot => Boolean(p && p.symbol));

  return {
    positions: normalizedPositions,
    crossMaintenanceMarginUsed: toNumber(payload?.crossMaintenanceMarginUsed),
    crossMarginSummary: normalizeMarginSummary(payload?.crossMarginSummary),
    marginSummary: normalizeMarginSummary(payload?.marginSummary),
    timestamp: toNumber(payload?.time),
    withdrawable: toNumber(payload?.withdrawable),
  };
};
