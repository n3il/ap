// src/data/DataProvider.ts

export interface CandleData {
  timestamp: number;   // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DataProvider {
  /**
   * Get a current or very recent price for an asset.
   * Should return a single numeric price.
   */
  getPrice(asset: string): Promise<number>;

  /**
   * Fetch OHLCV data. Providers that do not
   * support candles natively may construct/approximate them.
   */
  getCandles(
    asset: string,
    interval: string,
    lookbackHours: number
  ): Promise<CandleData[]>;

  /**
   * Optional: return asset metadata (tick size, symbol mapping,
   * oracle attributes, etc.)
   */
  getMetadata?(asset: string): Promise<any>;

  /**
   * Optional: For providers that track user/account state (only HL or Rialo).
   */
  getAccountState?(userId: string): Promise<any>;
}
