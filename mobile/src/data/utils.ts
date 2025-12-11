import { Heap } from "heap-js";
import type { MarketAssetSnapshot } from "@/data/mappings/hyperliquid";

type SortKey =
  | "dayNotionalVolume"
  | "fundingRate"
  | "openInterest"
  | "markPrice";

const DEFAULT_K = 10;

const toHeapValue = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? Number(value) : -Infinity;

export function getTopKAssets(
  assets: MarketAssetSnapshot[],
  sortKey: SortKey = "dayNotionalVolume",
  k: number = DEFAULT_K,
): MarketAssetSnapshot[] {
  const heap = new Heap<MarketAssetSnapshot>((a, b) => {
    return toHeapValue(a[sortKey]) - toHeapValue(b[sortKey]);
  });

  assets.forEach((asset) => {
    const metric = toHeapValue(asset[sortKey]);
    if (metric === -Infinity) return;

    if (heap.length < k) {
      heap.push(asset);
      return;
    }

    const smallest = heap.peek();
    if (smallest && metric > toHeapValue(smallest[sortKey])) {
      heap.pop();
      heap.push(asset);
    }
  });

  return heap
    .toArray()
    .sort(
      (a, b) => toHeapValue(b[sortKey]) - toHeapValue(a[sortKey]),
    );
}
