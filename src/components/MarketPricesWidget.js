import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Button } from '@/components/ui';
import { useRouter } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';
import { useMarketPrices, useMarketPricesStore } from '@/hooks/useMarketPrices';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import {
  formatCurrency,
  formatPercent,
} from '@/utils/marketFormatting';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionTitle from '@/components/SectionTitle';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/theme';
import { Pressable, Image } from 'react-native';

const SPARKLINE_WIDTH = 88;
const SPARKLINE_HEIGHT = 32;

const Sparkline = ({ data = [], positiveColor, negativeColor, neutralColor }) => {
  const valid = data.filter((value) => Number.isFinite(value));

  if (valid.length < 2) {
    return null;
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max === min ? 1 : max - min;
  const step = SPARKLINE_WIDTH / (valid.length - 1);

  const points = valid
    .map((value, index) => {
      const x = index * step;
      const normalized = (value - min) / range;
      const y = SPARKLINE_HEIGHT - normalized * SPARKLINE_HEIGHT;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const isUp = valid[valid.length - 1] >= valid[0];
  const stroke = isUp ? positiveColor : negativeColor;

  return (
    <Svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT}>
      <Polyline
        points={points}
        fill="none"
        stroke={stroke ?? neutralColor}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

const PriceColumn = ({
  symbol,
  index,
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
  compact,
  isLast,
}) => {
  const {
    colors: palette,
    success,
    error: errorColor,
    withOpacity,
  } = useColors();

  const positiveColor = success;
  const negativeColor = errorColor;
  const neutralColor = palette.mutedForeground;

  // Get asset data from Zustand store - use a selector that returns just the asset
  const asset = useMarketPricesStore(
    useCallback((state) => state.tickers[symbol]?.asset, [symbol])
  );

  // Provide fallback asset if not yet loaded
  const displayAsset = useMemo(() => asset ?? {
    id: symbol,
    symbol: symbol,
    name: symbol,
    price: null,
  }, [asset, symbol]);

  const hasChange = Number.isFinite(rangePercent);
  const changeIsPositive = hasChange && rangePercent >= 0;
  const changeColor = hasChange
    ? changeIsPositive
      ? positiveColor
      : negativeColor
    : neutralColor;

  // Animated opacity for price flash effect
  const priceOpacity = useSharedValue(0.8);
  const prevPrice = useRef(displayAsset?.price);

  useEffect(() => {
    // Flash when price changes
    if (prevPrice.current !== displayAsset?.price && Number.isFinite(displayAsset?.price)) {
      priceOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.8, { duration: 300 })
      );
    }
    prevPrice.current = displayAsset?.price;
  }, [displayAsset?.price]);

  const priceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceOpacity.value,
  }));

  if (compact) {
    return (
      <View
        sx={{
          flex: 1,
          paddingVertical: 1,
          gap: 1,
        }}
      >
        <Text
          sx={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'mutedForeground',
          }}
        >
          {displayAsset?.symbol ?? '—'}
        </Text>
        <Animated.Text
          style={[
            {
              color: palette.textPrimary,
              fontSize: 14,
              fontWeight: '500',
            },
            priceAnimatedStyle,
          ]}
        >
          {formatCurrency(displayAsset?.price)}
        </Animated.Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
          <Text sx={{ fontSize: 11, fontWeight: '600', color: changeColor }}>
            {hasChange ? formatPercent(rangePercent) : '—'}
          </Text>
          <Text sx={{ fontSize: 11, color: 'secondary500' }}>
            ({Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta).replace('$', '') : '—'})
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View sx={{ flex: 1 }}>
      <Text
        sx={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: 'mutedForeground',
          marginBottom: 1
        }}
      >
        {displayAsset?.symbol ?? '—'}
      </Text>
      <Animated.Text
        style={[
          {
            color: palette.textPrimary,
            fontSize: 16,
            fontWeight: '700',
          },
          priceAnimatedStyle,
        ]}
        numberOfLines={1}
      >
        {formatCurrency(displayAsset?.price)}
      </Animated.Text>
      {displayAsset?.price ? (
        <View sx={{ marginTop: 2, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Text sx={{ fontSize: 12, fontWeight: '600', color: changeColor }}>
            {hasChange ? formatPercent(rangePercent) : '—'}
          </Text>
          <Text sx={{ fontSize: 11, color: 'secondary500', marginLeft: 2 }}>
            ({Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta).replace('$', '') : '—'})
          </Text>
        </View>
      ) : null}
      <View sx={{ marginTop: 3, height: SPARKLINE_HEIGHT }}>
        {!isHistoryLoading && (
          <Sparkline
            data={sparklineData}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
            neutralColor={neutralColor}
          />
        )}
      </View>
    </View>
  );
};

export default function MarketPricesWidget({
  tickers,
  sx: customSx,
  timeframe,
}) {
  const [compact, setCompact] = useState(true);
  const {
    colors: palette,
    success,
    error: errorColor,
    warning,
    primary,
    withOpacity,
  } = useColors();
  const neutralColor = palette.mutedForeground;
  const router = useRouter();
  const {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
  } = useMarketPrices(tickers);

  const {
    data: historyData,
    isFetching: historyFetching,
    error: historyError,
  } = useMarketHistory(normalizedTickers, timeframe);

  const displayAssets = useMemo(() => {
    if (!normalizedTickers.length) return assets;
    return normalizedTickers.map((symbol) => {
      const uppercase = symbol.toUpperCase();
      return (
        assets.find((asset) => asset?.id === uppercase || asset?.symbol === uppercase) ?? {
          id: uppercase,
          symbol: uppercase,
          name: uppercase,
          price: null,
        }
      );
    });
  }, [assets, normalizedTickers]);

  return (
    <Pressable onPress={() => setCompact(!compact)} sx={customSx}>
      <View
        sx={{
          flexDirection: 'row',
          gap: compact ? 2 : 4,
        }}
      >
        {displayAssets.length ? (
          displayAssets.map((asset, index) => {
            const symbol = asset?.symbol;
            const history = historyData?.[symbol] ?? [];
            const sparklinePoints = history.map((point) => point.close);
            const baseline = history.length ? history[0].close : null;

            const rangeDelta =
              Number.isFinite(asset?.price) && Number.isFinite(baseline)
                ? asset.price - baseline
                : null;
            const rangePercent =
              Number.isFinite(rangeDelta) && Number.isFinite(baseline) && baseline !== 0
                ? (rangeDelta / baseline) * 100
                : null;

            return (
              <PriceColumn
                key={symbol ?? index}
                symbol={symbol}
                index={index}
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
                compact={compact}
                isLast={index === displayAssets.length - 1}
              />
            );
          })
        ) : (
          <View
            sx={{
              flex: compact ? undefined : 1,
              width: '100%',
              alignItems: 'center',
              paddingVertical: compact ? 1 : 2,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.foreground} />
            ) : (
              <Text sx={{ fontSize: 14, color: 'mutedForeground' }}>No market data</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
