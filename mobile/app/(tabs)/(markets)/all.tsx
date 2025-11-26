import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import ContainerView from "@/components/ContainerView";
import {
  AssetSelectorModal,
  INDICATOR_CHIPS,
  IndicatorChips,
  MARKET_ASSETS,
  MARKET_SECTION_TABS,
  MarketAssetHeader,
  MarketChartPanel,
  MarketOrderTicket,
  MarketSectionTabs,
  MarketStatsStrip,
  QUICK_TIMEFRAMES,
  TradeActionModal,
} from "@/components/markets";
import TimeframeShortcutRow from "@/components/markets/TimeframeShortcutRow";
import { ScrollView, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { useMockAccountBalance } from "@/hooks/useMockAccountBalance";
import { useTradingData } from "@/hooks/useTradingData";
import { withOpacity } from "@/theme/utils";

export default function MarketsScreen() {
  const [selectedAssetId, setSelectedAssetId] = useState(MARKET_ASSETS[0].id);
  const [activeSection, setActiveSection] = useState("markets");
  const [timeframe, setTimeframe] = useState("1m");
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState("buy");
  const [favorites, setFavorites] = useState([]);

  const selectedAsset = useMemo(
    () =>
      MARKET_ASSETS.find((asset) => asset.id === selectedAssetId) ??
      MARKET_ASSETS[0],
    [selectedAssetId],
  );

  const { assets: priceAssets } = useMarketPrices(
    MARKET_ASSETS.map((asset) => asset.symbol),
  );
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
  const { placeOrder, isPlacingOrder } = useTradingData({
    ledgerType: "paper",
  });
  const accountBalance = useMockAccountBalance();

  const availableBalance =
    accountBalance?.availableMargin ?? accountBalance?.wallet ?? 0;

  const handleToggleFavorite = (assetOrId) => {
    const id = typeof assetOrId === "string" ? assetOrId : assetOrId?.id;
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
        contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 18 }}
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

        <MarketSectionTabs
          sections={MARKET_SECTION_TABS}
          active={activeSection}
          onChange={setActiveSection}
        />

        <MarketStatsStrip asset={selectedAsset} />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TimeframeShortcutRow
            options={QUICK_TIMEFRAMES}
            active={timeframe}
            onChange={setTimeframe}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableIcon name="swap-horizontal" />
            <TouchableIcon name="chart-line" />
            <TouchableIcon name="dots-horizontal" />
          </View>
        </View>

        <MarketChartPanel
          asset={selectedAsset}
          price={currentPrice}
          volume={selectedAsset.volume24h}
          timeframe={timeframe}
        />

        <IndicatorChips indicators={INDICATOR_CHIPS} />

        <MarketOrderTicket
          asset={selectedAsset}
          price={currentPrice}
          availableBalance={availableBalance}
          onSubmit={handlePlaceOrder}
          isSubmitting={isPlacingOrder}
        />
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

function TouchableIcon({ name }) {
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: withOpacity(colors.backgroundSecondary, 0.4),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialCommunityIcons
        name={name}
        size={18}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
  );
}
