import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, GlassButton } from '@/components/ui';
import Svg, { Polyline } from 'react-native-svg';
import { useMarketPrices, useMarketPricesStore } from '@/hooks/useMarketPrices';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import {
  formatCurrency,
  formatPercent,
} from '@/utils/marketFormatting';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColors } from '@/theme';
import { Dimensions } from 'react-native';
import { GLOBAL_PADDING } from './ContainerView';
import { GlassView } from 'expo-glass-effect';
import { ROUTES } from '@/config/routes';
import { useTimeframeStore } from '@/stores/useTimeframeStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SPARKLINE_WIDTH = (width - GLOBAL_PADDING * 4) / 3;
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
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
  scrollY,
}) => {
  const router = useRouter();
  const {
    colors: palette,
    success,
    error: errorColor,
  } = useColors();

  const positiveColor = success;
  const negativeColor = errorColor;
  const neutralColor = palette.mutedForeground;

  // Get asset data from Zustand store
  const asset = useMarketPricesStore(
    useCallback((state) => state.tickers[symbol]?.asset, [symbol])
  );

  const onPress = () => {
    router.push(ROUTES.TABS_EXPLORE_MARKETS.path);
  };

  const displayAsset = useMemo(() => asset ?? {
    id: symbol,
    symbol: symbol,
    name: symbol,
    price: null,
  }, [asset, symbol]);

  const hasChange = Number.isFinite(rangePercent);
  const changeIsPositive = hasChange && rangePercent >= 0;
  const changeColor = hasChange
    ? changeIsPositive ? positiveColor : negativeColor
    : neutralColor;

  // Price flash effect
  const priceOpacity = useSharedValue(1);
  const prevPrice = useRef(displayAsset?.price);

  useEffect(() => {
    if (prevPrice.current !== displayAsset?.price && Number.isFinite(displayAsset?.price)) {
      priceOpacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(.7, { duration: 200 })
      );
    }
    prevPrice.current = displayAsset?.price;
  }, [displayAsset?.price]);

  // Animated styles for each element
  const symbolStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };

    const progress = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP);
    return {
      fontSize: interpolate(progress, [0, 1], [11, 10]),
    };
  }, [scrollY]);

  const priceStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        fontSize: 16,
        fontWeight: '400',
        opacity: priceOpacity.value,
      };
    }

    const progress = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP);
    return {
      fontSize: interpolate(progress, [0, 1], [16, 12]),
      fontWeight: progress > 0.5 ? '400' : '500',
      opacity: priceOpacity.value,
    };
  }, [scrollY]);

  const changeContainerStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 2 };

    const progress = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP);
    return {
      marginTop: interpolate(progress, [0, 1], [2, 1]),
    };
  }, [scrollY]);

  const changeTextStyle = useAnimatedStyle(() => {
    if (!scrollY) return { fontSize: 11 };

    const progress = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP);
    return {
      fontSize: interpolate(progress, [0, 1], [11, 10]),
    };
  }, [scrollY]);

  const sparklineStyle = useAnimatedStyle(() => {
    if (!scrollY) return { marginTop: 8, height: SPARKLINE_HEIGHT };

    const progress = interpolate(scrollY.value, [0, 100], [0, 1], Extrapolation.CLAMP);
    return {
      marginTop: interpolate(progress, [0, 1], [8, 0]),
      marginBottom: interpolate(progress, [0, 1], [8, 0]),
      opacity: interpolate(progress, [0, 0.7, 1], [1, 0.3, 0], Extrapolation.CLAMP),
      height: interpolate(progress, [0, 1], [SPARKLINE_HEIGHT, 0], Extrapolation.CLAMP),
    };
  }, [scrollY]);

  return (
    <GlassButton
      style={{
        flex: 1,
        padding: 10,
        paddingVertical: 8,
        borderRadius: 12,
        width: width / 3,
        marginLeft: GLOBAL_PADDING,
      }}
      glassEffectStyle='regular'
      onPress={onPress}
      isInteractive
    >
      <Animated.Text
        style={[
          {
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: palette.mutedForeground,
          },
          symbolStyle,
        ]}
      >
        {displayAsset?.symbol ?? '—'}
      </Animated.Text>

      <Animated.Text
        style={[
          {
            color: palette.textPrimary,
            marginTop: 2,
          },
          priceStyle,
        ]}
        numberOfLines={1}
      >
        {formatCurrency(displayAsset?.price)}
      </Animated.Text>

      {displayAsset?.price && (
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 4,
            },
            changeContainerStyle,
          ]}
        >
          <Animated.Text
            style={[
              {
                fontWeight: '600',
                color: changeColor,
              },
              changeTextStyle,
            ]}
          >
            {hasChange ? formatPercent(rangePercent) : '—'}
          </Animated.Text>
          <Text style={{ fontSize: 10, color: palette.mutedForeground }}>
            {Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta) : '—'}
          </Text>
        </Animated.View>
      )}

      <Animated.View
        style={[
          {
            overflow: 'hidden',
          },
          sparklineStyle,
        ]}
      >
        {!isHistoryLoading && sparklineData.length > 0 && (
          <Sparkline
            data={sparklineData}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
            neutralColor={neutralColor}
          />
        )}
      </Animated.View>
    </GlassButton>
  );
};

export default function MarketPricesWidget({
  tickers,
  sx: customSx,
  scrollY,
}) {
  const { colors: palette } = useColors();
  const { timeframe } = useTimeframeStore();
  const { normalizedTickers, assets, isLoading } = useMarketPrices(tickers);
  const { data: historyData, isFetching: historyFetching } = useMarketHistory(normalizedTickers, timeframe);

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
    <Animated.View style={[customSx]}>
      <ScrollView
        horizontal
        scrollEventThrottle={16}
        contentContainerStyle={[{ gap: 0, paddingRight: GLOBAL_PADDING, paddingVertical: 8 }]}
        showsHorizontalScrollIndicator={false}
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
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
                scrollY={scrollY}
              />
            );
          })
        ) : (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.foreground} />
            ) : (
              <Text sx={{ fontSize: 14, color: 'mutedForeground' }}>No market data</Text>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}
