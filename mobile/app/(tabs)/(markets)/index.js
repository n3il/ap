import React, { useMemo, useState } from 'react';
import { ScrollView } from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { useTradingData } from '@/hooks/useTradingData';
import { useMockAccountBalance } from '@/hooks/useMockAccountBalance';
import {
  AssetSelectorModal,
  MarketAssetHeader,
  MarketChartPanel,
  MarketOrderBook,
  MarketTabBar,
  MarketTradesTable,
  TradeActionModal,
  TradeHistoryPanel,
  MARKET_ASSETS,
  MARKET_TABS,
} from '@/components/markets';
import { buildRecentTrades, buildTradeHistoryEntries } from '@/components/markets/utils';

export default function MarketsScreen() {
  const [selectedAssetId, setSelectedAssetId] = useState(MARKET_ASSETS[0].id);
  const [activeTab, setActiveTab] = useState('chart');
  const [timeframe, setTimeframe] = useState('1h');
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState('buy');
  const [favorites, setFavorites] = useState([]);

  const selectedAsset = useMemo(
    () => MARKET_ASSETS.find((asset) => asset.id === selectedAssetId) ?? MARKET_ASSETS[0],
    [selectedAssetId],
  );

  const { assets: priceAssets } = useMarketPrices(MARKET_ASSETS.map((asset) => asset.symbol));
  const priceMap = useMemo(() => {
    const map = {};
    priceAssets.forEach((asset) => {
      if (asset?.symbol) {
        map[asset.symbol] = asset.price;
      }
    });
    return map;
  }, [priceAssets]);

  const currentPrice = priceMap[selectedAsset.symbol] ?? selectedAsset.price;
  const { trades, placeOrder, isPlacingOrder } = useTradingData({ ledgerType: 'paper' });
  const accountBalance = useMockAccountBalance();

  const historyEntries = useMemo(
    () => buildTradeHistoryEntries(trades, selectedAsset.symbol),
    [trades, selectedAsset.symbol],
  );

  const recentTrades = useMemo(
    () => buildRecentTrades(trades, selectedAsset.symbol, currentPrice),
    [trades, selectedAsset.symbol, currentPrice],
  );

  const availableBalance = accountBalance?.availableMargin ?? accountBalance?.wallet ?? 0;

  const handleToggleFavorite = (assetOrId) => {
    const id = typeof assetOrId === 'string' ? assetOrId : assetOrId?.id;
    if (!id) return;
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id],
    );
  };

  const handleSelectAsset = (asset) => {
    if (!asset) return;
    setSelectedAssetId(asset.id);
    setAssetSelectorOpen(false);
  };

  const handleOpenTrade = (side) => {
    setTradeSide(side);
    setTradeModalOpen(true);
  };

  const handlePlaceOrder = (payload) => {
    placeOrder(payload);
    setTradeModalOpen(false);
  };

  return (
    <ContainerView>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <MarketAssetHeader
          asset={selectedAsset}
          price={currentPrice}
          priceChange={selectedAsset.change24h}
          onSelectAsset={() => setAssetSelectorOpen(true)}
          onOpenTrade={handleOpenTrade}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />

        <MarketTabBar tabs={MARKET_TABS} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'chart' && (
          <MarketChartPanel
            asset={selectedAsset}
            price={currentPrice}
            volume={selectedAsset.volume24h}
            timeframe={timeframe}
            onChangeTimeframe={setTimeframe}
          />
        )}

        {activeTab === 'orderBook' && (
          <MarketOrderBook symbol={selectedAsset.symbol} price={currentPrice} />
        )}

        {activeTab === 'trades' && (
          <MarketTradesTable trades={recentTrades} symbol={selectedAsset.symbol} />
        )}

        <TradeHistoryPanel trades={historyEntries} />
      </ScrollView>

      <AssetSelectorModal
        visible={assetSelectorOpen}
        onClose={() => setAssetSelectorOpen(false)}
        assets={MARKET_ASSETS}
        favorites={favorites}
        onSelect={handleSelectAsset}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        priceMap={priceMap}
      />

      <TradeActionModal
        visible={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        asset={selectedAsset}
        price={currentPrice}
        availableBalance={availableBalance}
        defaultSide={tradeSide}
        onSubmit={handlePlaceOrder}
        isSubmitting={isPlacingOrder}
      />
    </ContainerView>
  );
}
