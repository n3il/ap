import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { toHyperliquidOrder } from "./mapping.ts";
import { LLMTradeAction } from "../llm/types.ts";
import { Position } from "./types.ts";

const FIXED_NONCE = 123456789;
const EMPTY_SIG = { r: "", s: "", v: 27 };

const asset = {
  Ticker: "FARTCOIN",
  "Sz-Decimals": 3,
  "Max-Leverage": 10,
  "Day-Ntl-Vlm": 0,
  Funding: 0,
  "Impact-Pxs": [0.37, 0.38] as [number, number],
  "Mark-Px": 0.3736,
  "Mid-Px": 0.3735,
  "Open-Interest": 0,
  "Oracle-Px": 0.3736,
  Premium: 0,
  "Prev-Day-Px": 0.37,
  "Asset-Id": 141,
};

const renderAsset = {
  Ticker: "RENDER",
  "Sz-Decimals": 0,
  "Max-Leverage": 5,
  "Day-Ntl-Vlm": 0,
  Funding: 0.0000125,
  "Impact-Pxs": [1.602702, 1.605486] as [number, number],
  "Mark-Px": 1.6035,
  "Mid-Px": 1.6041,
  "Open-Interest": 30130,
  "Oracle-Px": 1.6045,
  Premium: 0,
  "Prev-Day-Px": 1.74,
  "Asset-Id": 114,
};

const baseOpts = { nonce: FIXED_NONCE, signature: EMPTY_SIG, vaultAddress: "", expiresAfter: 0 };
const makePosition = (szi: string, coin = "FARTCOIN"): Position => ({
  coin,
  cumFunding: { allTime: "0", sinceChange: "0", sinceOpen: "0" },
  entryPx: "0",
  leverage: { rawUsd: "0", type: "cross", value: 1 },
  liquidationPx: "0",
  marginUsed: "0",
  maxLeverage: 10,
  positionValue: "0",
  returnOnEquity: "0",
  szi,
  unrealizedPnl: "0",
});

Deno.test("OPEN LONG", async () => {
  const trade: LLMTradeAction = {
    type: "OPEN",
    asset: "FARTCOIN",
    direction: "LONG",
    leverage: 1,
    trade_amount: 100,
    limit_price: 0.5,
    reason: "test",
    confidenceScore: 1,
  };
  const result = await toHyperliquidOrder(asset, trade, makePosition("0"), baseOpts);

  const expected = {
    action: {
      type: "order",
      orders: [
        {
          a: 141,
          b: true,
          p: result.action.orders[0].p,
          s: result.action.orders[0].s,
          r: false,
          t: { limit: { tif: "Gtc" } },
        },
      ],
      grouping: "na",
      builder: undefined,
    },
    nonce: FIXED_NONCE,
    // signature: EMPTY_SIG,
    // vaultAddress: "",
    // expiresAfter: 0,
  };

  assertEquals(result, expected, "OPEN LONG mapping mismatch");
});

Deno.test("OPEN SHORT", async () => {
  const trade: LLMTradeAction = {
    type: "OPEN",
    asset: "FARTCOIN",
    direction: "SHORT",
    leverage: 1,
    trade_amount: 100,
    limit_price: 0.4,
    reason: "test",
    confidenceScore: 1,
  };
  const result = await toHyperliquidOrder(asset, trade, makePosition("0"), baseOpts);

  const expected = {
    action: {
      type: "order",
      orders: [
        {
          a: 141,
          b: false,
          p: result.action.orders[0].p,
          s: result.action.orders[0].s,
          r: false,
          t: { limit: { tif: "Gtc" } },
        },
      ],
      grouping: "na",
      builder: undefined,
    },
    nonce: FIXED_NONCE,
    // signature: EMPTY_SIG,
    // vaultAddress: "",
    // expiresAfter: 0,
  };

  assertEquals(result, expected, "OPEN SHORT mapping mismatch");
});

Deno.test("CLOSE LONG", async () => {
  const trade: LLMTradeAction = {
    type: "CLOSE",
    position_id: "FARTCOIN",
    asset: "FARTCOIN",
    reason: "test",
    confidenceScore: 1,
  };
  const result = await toHyperliquidOrder(asset, trade, makePosition("1.0"), baseOpts);

  const expected = {
    action: {
      type: "order",
      orders: [
        {
          a: 141,
          b: false,
          p: "0",
          s: "0",
          r: true,
          t: { limit: { tif: "Ioc" } },
        },
      ],
      grouping: "na",
      builder: undefined,
    },
    nonce: FIXED_NONCE,
    // signature: EMPTY_SIG,
    // vaultAddress: "",
    // expiresAfter: 0,
  };

  assertEquals(result, expected, "CLOSE LONG mapping mismatch");
});

Deno.test("CLOSE SHORT", async () => {
  const trade: LLMTradeAction = {
    type: "CLOSE",
    position_id: "FARTCOIN",
    asset: "FARTCOIN",
    reason: "test",
    confidenceScore: 1,
  };
  const result = await toHyperliquidOrder(asset, trade, makePosition("-2.5"), baseOpts);

  const expected = {
    action: {
      type: "order",
      orders: [
        {
          a: 141,
          b: true,
          p: "0",
          s: "0",
          r: true,
          t: { limit: { tif: "Ioc" } },
        },
      ],
      grouping: "na",
      builder: undefined,
    },
    nonce: FIXED_NONCE,
    // signature: EMPTY_SIG,
    // vaultAddress: "",
    // expiresAfter: 0,
  };

  assertEquals(result, expected, "CLOSE SHORT mapping mismatch");
});

Deno.test("CLOSE RENDER snapshot", async () => {
  const trade: LLMTradeAction = {
    type: "CLOSE",
    position_id: "RENDER",
    asset: "RENDER",
    reason: "test",
    confidenceScore: 0.95,
  };
  const opts = { ...baseOpts, nonce: 1765056256131 };
  const result = await toHyperliquidOrder(renderAsset, trade, makePosition("1.0", "RENDER"), opts);

  const expected = {
    action: {
      type: "order",
      orders: [
        {
          a: 114,
          b: false,
          p: "0",
          s: "0",
          r: true,
          t: { limit: { tif: "Ioc" } },
        },
      ],
      grouping: "na",
      builder: undefined,
    },
    nonce: 1765056256131,
  };

  assertEquals(result, expected, "CLOSE RENDER mapping mismatch");
});
