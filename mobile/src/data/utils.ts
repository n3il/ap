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
  percentChange: number;
}

// ---------------------------------------------
// Config
// ---------------------------------------------
const K = 10;

// ---------------------------------------------
// Main function
// ---------------------------------------------
export function getTopKAssets(
  universe: AssetData[],
  assetContexts: AssetContext[]
): TopKOutput[] {
  const heap: HeapItem[] = [];

  const push = (item: HeapItem) => {
    heap.push(item);
    siftUp(heap, heap.length - 1);
  };

  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      siftDown(heap, 0);
    }
    return top;
  };

  const peek = () => heap[0];

  const compare = (a: HeapItem, b: HeapItem) =>
    a.dayNtlVlmNum - b.dayNtlVlmNum;

  // ---------------------------------------------
  // Streaming top-K logic
  // ---------------------------------------------
  for (let i = 0; i < universe.length; i++) {
    const assetData = universe[i];
    const ctx = assetContexts[i];

    const dayNtlVlmNum = Number(ctx.dayNtlVlm);
    const fundingNum = Number(ctx.funding);

    if (dayNtlVlmNum <= 0 && fundingNum <= 0) continue;

    const item: HeapItem = {
      assetData,
      ctx,
      assetId: i,
      dayNtlVlmNum,
      fundingNum,
    };

    if (heap.length < K) {
      push(item);
    } else if (compare(item, peek()) > 0) {
      pop();
      push(item);
    }
  }

  // Sort the resulting heap
  const result = heap.sort(compare);

  // Final formatted output
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

// ---------------------------------------------
// Heap Helpers
// ---------------------------------------------
function siftUp(heap: HeapItem[], idx: number) {
  while (idx > 0) {
    const p = (idx - 1) >> 1;
    if (heap[idx].dayNtlVlmNum >= heap[p].dayNtlVlmNum) break;
    swap(heap, idx, p);
    idx = p;
  }
}

function siftDown(heap: HeapItem[], idx: number) {
  const n = heap.length;
  while (true) {
    const l = idx * 2 + 1;
    const r = l + 1;
    let smallest = idx;

    if (l < n && heap[l].dayNtlVlmNum < heap[smallest].dayNtlVlmNum)
      smallest = l;
    if (r < n && heap[r].dayNtlVlmNum < heap[smallest].dayNtlVlmNum)
      smallest = r;

    if (smallest === idx) break;

    swap(heap, idx, smallest);
    idx = smallest;
  }
}

function swap(arr: HeapItem[], i: number, j: number) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}
