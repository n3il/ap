import { OrderRequest } from "@nktkas/hyperliquid";
import { LLMTradeAction } from "../llm/types.ts";
import { HyperliquidOrder, Position } from "./types.ts";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";

export type AssetType = {
  Ticker: string;
  "Sz-Decimals": number;
  "Max-Leverage": number;
  "Day-Ntl-Vlm": number;
  Funding: number;
  "Impact-Pxs": [number, number];
  "Mark-Px": number;
  "Mid-Px": number;
  "Open-Interest": number;
  "Oracle-Px": number;
  Premium: number;
  "Prev-Day-Px": number;
  "Asset-Id": number;
};

type TifType = "Alo" | "Ioc" | "Gtc";

export function toHyperliquidOrder(
  asset: AssetType,
  trade: LLMTradeAction,
  position: Position,
  opts: {
    cloid?: string;
    tif?: TifType;
    vaultAddress?: string;
    expiresAfter?: number;
    nonce?: number;
    signature?: { r: string; s: string; v: number };
    builder?: { b: string; f: number };
  } = {}
): OrderRequest {
  const now = Date.now();
  const tif = opts.tif ?? "Gtc";

  const px = (x: number) => formatPrice(x, asset["Sz-Decimals"], true);
  const sz = (n: number, p: number) =>
    formatSize((n / p).toString(), asset["Sz-Decimals"]);

  const mkTif = tif === "Gtc" ? "Ioc" : tif;
  const limTif = tif === "Gtc" ? "Gtc" : tif;

  const make = (o: HyperliquidOrder): OrderRequest => ({
    action: {
      type: "order",
      orders: [o],
      grouping: "na",
      builder: opts.builder,
    },
    nonce: opts.nonce ?? now,
    // signature: opts.signature ?? { r: "", s: "", v: 27 },
    // vaultAddress: opts.vaultAddress,
    // expiresAfter: opts.expiresAfter ?? 0,
  });

  if (trade.type === "OPEN") {
    const isBuy = trade.direction === "LONG";
    const lp = trade.limit_price;
    const price = lp ? px(lp) : px(asset["Mid-Px"]);
    const size = lp ? sz(trade.trade_amount, lp) : sz(trade.trade_amount, asset["Mid-Px"]);
    return make({
      a: asset["Asset-Id"],
      b: isBuy,
      p: price,
      s: size,
      r: false,
      t: { limit: { tif: lp ? limTif : mkTif } },
      ...(opts.cloid && { c: opts.cloid })
    });
  }

  if (trade.type === "CLOSE") {
    const isBuy = Number(position.szi) < 0;
    const lp = trade.exit_limit_price;
    return make({
      a: asset["Asset-Id"],
      b: isBuy,
      p: lp ? px(lp) : "0",
      s: "0",
      r: true,
      t: { limit: { tif: lp ? limTif : mkTif } },
      ...(opts.cloid && { c: opts.cloid })
    });
  }

  throw new Error("Unsupported TradeAction type");
}
