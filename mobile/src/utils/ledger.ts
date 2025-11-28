export type LedgerTradeRow = {
  id: string;
  agent_id: string;
  account_id?: string;
  user_id?: string;
  symbol: string;
  type?: 'paper' | 'real';
  price?: number;
  quantity?: number;
  executed_at?: string;
  realized_pnl?: number | string | null;
  meta?: Record<string, unknown> | string | null;
};

export type LedgerPosition = {
  id: string;
  agent_id: string;
  asset: string;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
  size: number;
  collateral: number;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  entry_timestamp: string;
  exit_timestamp?: string;
  leverage: number;
  realized_pnl?: number;
  account_id?: string;
  user_id?: string;
  type?: 'paper' | 'real';
};

const OPEN_ACTIONS = new Set(['OPEN']);
const CLOSE_ACTIONS = new Set(['CLOSE']);

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const parseMeta = (
  meta: LedgerTradeRow["meta"],
): Record<string, unknown> => {
  if (!meta) return {};
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch (_error) {
      return {};
    }
  }
  return meta as Record<string, unknown>;
};

export function buildPositionsFromLedger(
  rows: LedgerTradeRow[] = [],
): LedgerPosition[] {
  const grouped = new Map<
    string,
    {
      open?: LedgerTradeRow & { parsedMeta: Record<string, unknown> };
      close?: LedgerTradeRow & { parsedMeta: Record<string, unknown> };
    }
  >();

  rows.forEach((row) => {
    const parsedMeta = parseMeta(row.meta);
    const positionId = String(parsedMeta.position_id ?? "");
    if (!positionId) return;

    const action = String(parsedMeta.action ?? "").toUpperCase();
    const entry = grouped.get(positionId) ?? {};

    if (OPEN_ACTIONS.has(action)) {
      entry.open = { ...row, parsedMeta };
    } else if (CLOSE_ACTIONS.has(action)) {
      entry.close = { ...row, parsedMeta };
    }

    grouped.set(positionId, entry);
  });

  const positions: LedgerPosition[] = [];

  grouped.forEach(({ open, close }, positionId) => {
    if (!open) return;
    const openMeta = open.parsedMeta;
    const side =
      (openMeta.position_side as LedgerPosition["side"]) ??
      (String(openMeta.action ?? "").includes("SHORT") ? "SHORT" : "LONG");
    const leverage = toNumber(openMeta.leverage, 1);
    const collateral = toNumber(openMeta.collateral ?? openMeta.size, 0);
    const entryPrice = toNumber(openMeta.entry_price ?? open.price, 0);
    const quantity =
      toNumber(openMeta.position_quantity ?? open.quantity, 0) ||
      (entryPrice ? (collateral * leverage) / entryPrice : 0);

    const position: LedgerPosition = {
      id: positionId,
      agent_id: open.agent_id,
      asset: open.symbol,
      side,
      status: close ? "CLOSED" : "OPEN",
      size: collateral,
      collateral,
      quantity,
      entry_price: entryPrice,
      entry_timestamp: String(openMeta.entry_timestamp ?? open.executed_at ?? ""),
      leverage,
      account_id: open.account_id,
      user_id: open.user_id,
      type: open.type,
    };

    if (close) {
      const closeMeta = close.parsedMeta;
      position.exit_price = toNumber(
        closeMeta.exit_price ?? close.price,
        undefined,
      );
      position.exit_timestamp = String(
        closeMeta.exit_timestamp ?? close.executed_at ?? "",
      );
      position.realized_pnl = toNumber(
        close.realized_pnl ?? closeMeta.realized_pnl,
        undefined,
      );
    }

    positions.push(position);
  });

  return positions.sort((a, b) => {
    const aTime = new Date(a.entry_timestamp).getTime();
    const bTime = new Date(b.entry_timestamp).getTime();
    return Number.isFinite(bTime) && Number.isFinite(aTime) ? bTime - aTime : 0;
  });
}

export function filterOpenPositions(positions: LedgerPosition[]): LedgerPosition[] {
  return positions.filter((position) => position.status === "OPEN");
}

export function filterClosedPositions(positions: LedgerPosition[]): LedgerPosition[] {
  return positions.filter((position) => position.status === "CLOSED");
}
