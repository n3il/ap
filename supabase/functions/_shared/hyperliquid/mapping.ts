import { LLMTradeAction } from "../llm/types.ts";
import { HyperliquidOrderBody, HyperliquidOrder } from "./types.ts";
import { formatPrice, formatSize, SymbolConverter } from "@nktkas/hyperliquid/utils";
import { HttpTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";

// Using the provided type definitions
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

// Define Time in Force options
type TifType = "Alo" | "Ioc" | "Gtc";

export function toHyperliquidOrder(
  asset: AssetType = {},
  trade: LLMTradeAction,
  opts?: {
    cloid?: string;
    tif?: TifType;
    vaultAddress?: string;
    expiresAfter?: number;
    nonce?: number;
  } = {}
): HyperliquidOrderBody {
  if (asset["Asset-Id"] == null) {
    const transport = new HttpTransport();
    const converter = await SymbolConverter.create({ transport });
    asset["Asset-Id"] = converter.getAssetId(trade.symbol);
    asset["Sz-Decimals"] = converter.getSzDecimals(trade.symbol);
  }

  const now = Date.now();
  const defaultTif = opts.tif ?? "Gtc";
  const { vaultAddress, expiresAfter, nonce } = opts;

  // --- Utility for Notional Size Calculation ---
  const calculateSize = (notionalAmount: number, price: number): string => {
    // trade_amount is assumed to be USD notional.
    const baseAmount = notionalAmount / price;
    return formatSize(baseAmount.toString(), asset["Sz-Decimals"]);
  };

  //
  // ------------- OPEN TRADE -------------
  //
  if (trade.type === "OPEN") {
    const isBuy = trade.direction === "LONG";
    const isLimit = !!trade.limit_price;

    let price: string;
    let size: string;
    let orderType: HyperliquidOrder["t"];

    if (isLimit) {
      // Limit Order
      price = formatPrice(trade.limit_price!, asset["Sz-Decimals"], true);
      size = calculateSize(trade.trade_amount, trade.limit_price!);
      orderType = {
        limit: {
          // Use GTC as default for limit orders
          tif: defaultTif === "Ioc" || defaultTif === "Alo" ? "Gtc" : defaultTif,
        },
      };
    } else {
      // Market Order
      // For market orders, set price to 0 and size to the calculated amount,
      // and use IOC/ALO TIF for immediate execution.
      price = "0";
      size = calculateSize(trade.trade_amount, asset["Mid-Px"]);
      orderType = {
        limit: {
          // Use IOC/Alo for market-style execution, default to IOC
          tif: defaultTif === "Gtc" ? "Ioc" : defaultTif,
        },
      };
    }

    const order: HyperliquidOrder = {
      a: asset["Asset-Id"],
      b: isBuy,
      p: price,
      s: size,
      r: false, // Always false for opening a position
      t: orderType,
      ...(opts.cloid ? { c: opts.cloid } : {}),
    };

    return {
      action: {
        type: "order",
        orders: [order],
        grouping: "na",
      },
      nonce: nonce ?? now,
      signature: {
        vaultAddress: vaultAddress ?? "",
        expiresAfter: expiresAfter ?? 0,
      },
    };
  }

  //
  // ------------- CLOSE TRADE -------------
  //
  if (trade.type === "CLOSE") {
    // To close a position, you must place an order in the *opposite* direction
    // of the existing position.
    // If trade.direction is LONG (position is long), you must SELL (b: false).
    // If trade.direction is SHORT (position is short), you must BUY (b: true).
    const isBuyToClose = trade.direction === "SHORT";
    const isLimitExit = !!trade.exit_limit_price;

    let price: string;
    let orderType: HyperliquidOrder["t"];

    if (isLimitExit) {
        // Limit Close Order (e.g., Take Profit)
        price = formatPrice(trade.exit_limit_price!, asset["Sz-Decimals"], true);
        orderType = {
            limit: {
                // Use GTC as default for take-profit limit orders
                tif: defaultTif === "Ioc" || defaultTif === "Alo" ? "Gtc" : defaultTif,
            },
        };
    } else {
        // Market Close Order
        // Price must be "0" for market orders using TIF aggressive types (IOC, ALO)
        price = "0";
        orderType = {
            limit: {
                // Use IOC/Alo for immediate market close
                tif: defaultTif === "Gtc" ? "Ioc" : defaultTif,
            },
        };
        // NOTE: The trigger type (like a stop/market exit) is only needed for
        // orders that should NOT immediately execute (e.g., stop loss/take profit triggers)
    }

    const order: HyperliquidOrder = {
      a: asset["Asset-Id"],
      b: isBuyToClose,
      p: price,
      s: "0",          // Use "0" size. With r: true, HL uses full position size.
      r: true,         // reduce-only is critical for position closing
      t: orderType,
      ...(opts.cloid ? { c: opts.cloid } : {}),
    };

    return {
      action: {
        type: "order",
        orders: [order],
        grouping: "na",
      },
      nonce: nonce ?? now,
      signature: {
        vaultAddress: vaultAddress ?? "",
        expiresAfter: expiresAfter ?? 0,
      },
    };
  }

  throw new Error("Unsupported TradeAction type");
}