import { Heap } from "heap-js";

// ---------------------------------------------
// Types
// ---------------------------------------------
export interface AssetData {
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

export interface AssetContext {
  dayNtlVlm: string | number;
  funding: string | number;
  impactPxs: string[] | number[];
  markPx: string | number;
  midPx: string | number;
  openInterest: string | number;
  oraclePx: string | number;
  premium: string | number;
  prevDayPx: string | number;
}

export interface TopKOutput {
  Ticker: string;
  "Sz-Decimals": number;
  "Max-Leverage": number;
  "Day-Ntl-Vlm": string | number;
  Funding: string | number;
  "Impact-Pxs": string[] | number[];
  "Mark-Px": string | number;
  "Mid-Px": string | number;
  "Open-Interest": string | number;
  "Oracle-Px": string | number;
  Premium: string | number;
  "Prev-Day-Px": string | number;
  "Asset-Id": number;
}

interface HeapItem {
  assetData: AssetData;
  ctx: AssetContext;
  assetId: number;
  dayNtlVlmNum: number;
  fundingNum: number;
  openInterestNum: number;
  markPxNum: number;
}

// Valid keys that can be used for sorting
export type SortKey = "dayNtlVlm" | "funding" | "openInterest" | "markPx";

// ---------------------------------------------
// Config
// ---------------------------------------------
const K = 10;

// Map sort key to HeapItem property
const KEY_MAP: Record<SortKey, keyof HeapItem> = {
  dayNtlVlm: "dayNtlVlmNum",
  funding: "fundingNum",
  openInterest: "openInterestNum",
  markPx: "markPxNum",
};

// ---------------------------------------------
// Main function
// ---------------------------------------------
export function getTopKAssets(
  universe: AssetData[],
  assetContexts: AssetContext[],
  sortKey: SortKey = "dayNtlVlm",
  k: number = K
): TopKOutput[] {
  const heapKey = KEY_MAP[sortKey];

  // Min-heap comparator: smallest value at top
  const comparator = (a: HeapItem, b: HeapItem) =>
    (a[heapKey] as number) - (b[heapKey] as number);

  // Create min-heap with heap-js
  const heap = new Heap<HeapItem>(comparator);

  // Streaming top-K logic
  for (let i = 0; i < universe.length; i++) {
    const assetData = universe[i];
    const ctx = assetContexts[i];

    const dayNtlVlmNum = Number(ctx.dayNtlVlm);
    const fundingNum = Number(ctx.funding);
    const openInterestNum = Number(ctx.openInterest);
    const markPxNum = Number(ctx.markPx);

    // Skip invalid entries
    if (dayNtlVlmNum <= 0 && fundingNum <= 0) continue;

    const item: HeapItem = {
      assetData,
      ctx,
      assetId: i,
      dayNtlVlmNum,
      fundingNum,
      openInterestNum,
      markPxNum,
    };

    if (heap.length < k) {
      heap.push(item);
    } else {
      const smallest = heap.peek();
      if (smallest && (item[heapKey] as number) > (smallest[heapKey] as number)) {
        heap.pop();
        heap.push(item);
      }
    }
  }

  // Extract and sort results (largest first)
  const result = heap.toArray().sort((a, b) =>
    (b[heapKey] as number) - (a[heapKey] as number)
  );

  // Format output
  return result.map(({ assetData, ctx, assetId }) => ({
    Ticker: assetData.name,
    "Sz-Decimals": assetData.szDecimals,
    "Max-Leverage": assetData.maxLeverage,
    "Day-Ntl-Vlm": ctx.dayNtlVlm,
    Funding: ctx.funding,
    "Impact-Pxs": ctx.impactPxs,
    "Mark-Px": ctx.markPx,
    "Mid-Px": ctx.midPx,
    "Open-Interest": ctx.openInterest,
    "Oracle-Px": ctx.oraclePx,
    Premium: ctx.premium,
    "Prev-Day-Px": ctx.prevDayPx,
    "Asset-Id": assetId,
  }));
}
