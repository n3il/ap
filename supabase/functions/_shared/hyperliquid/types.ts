

export type CandleData = {
  T: number,
  c: string,
  h: string,
  i: string,
  l: string,
  n: number,
  o: string,
  s: string,
  t: number,
  v: string
}

export type HistoricalOrder = {
  order: {
      coin: string,
      side: "A" | "B",
      limitPx: string,
      sz: string,
      oid: number,
      timestamp: number,
      triggerCondition: string,
      isTrigger: boolean,
      triggerPx: string,
      children: [],
      isPositionTpsl: boolean,
      reduceOnly: boolean,
      orderType: string,
      origSz: string,
      tif: string,
      cloid: string | null
    },
    status: "filled" | "open" | "canceled" | "triggered" | "rejected" | "marginCanceled",
    statusTimestamp: number
}

export type OpenOrder = {
  // openOrders
  coin: string,
  limitPx: string,
  oid: number,
  side: "A" | "B",
  sz: string,
  timestamp: number,
  // frontendOpenOrders
  isPositionTpsl: boolean,
  isTrigger: boolean,
  orderType: string,
  origSz: string,
  reduceOnly: boolean,
  triggerCondition: string,
  triggerPx: string,
}

export type AllMids = {
  [key: string]: number
}

export interface PortfolioResponse {
  assetPositions: AssetPosition[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  time: number;
  withdrawable: string;
}

export interface AssetPosition {
  position: Position;
  type: "oneWay" | string; // add more if needed
}

export interface Position {
  coin: string;
  cumFunding: CumFunding;
  entryPx: string;
  leverage: Leverage;
  liquidationPx: string;
  marginUsed: string;
  maxLeverage: number;
  positionValue: string;
  returnOnEquity: string;
  szi: string;
  unrealizedPnl: string;
}

export interface CumFunding {
  allTime: string;
  sinceChange: string;
  sinceOpen: string;
}

export interface Leverage {
  rawUsd: string;
  type: "isolated" | "cross" | string;
  value: number;
}

export interface MarginSummary {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
}
