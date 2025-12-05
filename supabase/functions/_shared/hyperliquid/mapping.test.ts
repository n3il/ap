import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { toHyperliquidOrder } from "./mapping.ts";

const FIXED_NONCE = 123456789;
const EMPTY_SIG = { r: "", s: "", v: 27 };

const asset = {
  Ticker: "FARTCOIN",
  "Sz-Decimals": 3,
  "Max-Leverage": 10,
  "Day-Ntl-Vlm": 0,
  Funding: 0,
  "Impact-Pxs": [0.37, 0.38],
  "Mark-Px": 0.3736,
  "Mid-Px": 0.3735,
  "Open-Interest": 0,
  "Oracle-Px": 0.3736,
  Premium: 0,
  "Prev-Day-Px": 0.37,
  "Asset-Id": 141,
};

const baseOpts = { nonce: FIXED_NONCE, signature: EMPTY_SIG, vaultAddress: "", expiresAfter: 0 };

Deno.test("OPEN LONG", async () => {
  const trade = { type: "OPEN", direction: "LONG", trade_amount: 100, limit_price: 0.5 };
  const result = await toHyperliquidOrder(asset, trade, { szi: "0" }, baseOpts);

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
  const trade = { type: "OPEN", direction: "SHORT", trade_amount: 100, limit_price: 0.4 };
  const result = await toHyperliquidOrder(asset, trade, { szi: "0" }, baseOpts);

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
  const trade = { type: "CLOSE", direction: "LONG" };
  const result = await toHyperliquidOrder(asset, trade, { szi: "1.0" }, baseOpts);

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
  const trade = { type: "CLOSE", direction: "SHORT" };
  const result = await toHyperliquidOrder(asset, trade, { szi: "-2.5" }, baseOpts);

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
