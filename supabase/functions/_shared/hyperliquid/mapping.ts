import { LLMTradeAction } from "../llm/types.ts";
import { HyperliquidOrderBody, HyperliquidOrder } from "./types.ts";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";

type AssetType = {
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

export function toHyperliquidOrder(
  asset: AssetType,
  trade: LLMTradeAction,
  opts?: {
    cloid?: string;
    tif?: "Alo" | "Ioc" | "Gtc";
    vaultAddress?: string;
    expiresAfter?: number;
    nonce?: number;
  } = {
    vaultAddress: undefined,
    expiresAfter: undefined,
    nonce: undefined,
  }
): HyperliquidOrderBody {
  const now = Date.now();

  //
  // ------------- OPEN TRADE -------------
  //
  if (trade.type === "OPEN") {
    const isBuy = trade.direction === "LONG";

    const price = trade.limit_price
      ? formatPrice(trade.limit_price, asset["Sz-Decimals"], true) // `true` for perp (default), `false` for spot
      : "0"; // market order if price = "0" ?

    const notionalAmount = trade.trade_amount / (trade.limit_price || asset["Mid-Px"])
    const size = trade.limit_price
      ? formatSize((notionalAmount).toString(), asset["Sz-Decimals"])
      : "0";

    const order: HyperliquidOrder = {
      a: asset["Asset-Id"],
      b: isBuy,
      p: price,
      s: size,
      r: false,
      t: {
        limit: {
          tif: opts.tif ?? "Gtc",
        },
        // trigger: {
        //   isMarket: true,
        // }
      },
      ...(opts.cloid ? { c: opts.cloid } : {}),
    };

    return {
      action: {
        type: "order",
        orders: [order],
        grouping: "na",
      },
      nonce: opts.nonce ?? now,
      signature: {
        vaultAddress: opts.vaultAddress ?? "",
        expiresAfter: opts.expiresAfter ?? 0,
      },
    };
  }

  //
  // ------------- CLOSE TRADE -------------
  //
  if (trade.type === "CLOSE") {
    const price = trade.exit_limit_price
      ? trade.exit_limit_price.toString()
      : "0"; // market close if null

    const order: HyperliquidOrder = {
      a: assetId,
      b: false,        // always sell to close
      p: price,
      s: "0",          // you normally use reduceOnly & let HL size = position size
      r: true,         // reduce-only
      t: {
        // limit: {
        //   tif: opts.tif ?? "Ioc",
        // },
        trigger: {
          isMarket: true,
        }
      },
      ...(opts.cloid ? { c: opts.cloid } : {}),
    };

    return {
      action: {
        type: "order",
        orders: [order],
        grouping: "na",
      },
      nonce: opts.nonce ?? now,
      signature: {
        vaultAddress: opts.vaultAddress ?? "",
        expiresAfter: opts.expiresAfter ?? 0,
      },
    };
  }

  throw new Error("Unsupported TradeAction type");
}