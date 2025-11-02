import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Button } from '@/components/ui';
import { useRouter } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';
import { useMarketSnapshot } from '@/hooks/useMarketSnapshot';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import {
  formatCurrency,
  formatPercent,
} from '@/utils/marketFormatting';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionTitle from '@/components/SectionTitle';
import { useSx } from 'dripsy';
import TimeFrameSelector from '@/components/TimeFrameSelector';
import SvgChart from './SvgChart';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/theme';

const SPARKLINE_WIDTH = 88;
const SPARKLINE_HEIGHT = 32;

const Sparkline = ({ data = [] }) => {
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
  const stroke = isUp ? '#34d399' : '#f87171';

  return (
    <Svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT}>
      <Polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};

const PriceColumn = ({
  asset,
  index,
  sparklineData,
  rangeDelta,
  rangePercent,
  isHistoryLoading,
}) => {
  const hasChange = Number.isFinite(rangePercent);
  const changeIsPositive = hasChange && rangePercent >= 0;
  const changeColor = hasChange
    ? changeIsPositive
      ? '#34d399'
      : '#f87171'
    : '#94a3b8';

  // Animated opacity for price flash effect
  const priceOpacity = useSharedValue(0.8);
  const prevPrice = useRef(asset?.price);

  useEffect(() => {
    // Flash when price changes
    if (prevPrice.current !== asset?.price && Number.isFinite(asset?.price)) {
      priceOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.8, { duration: 300 })
      );
    }
    prevPrice.current = asset?.price;
  }, [asset?.price]);

  const priceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceOpacity.value,
  }));

  return (
    <View sx={{ flex: 1 }}>
      <Text
        sx={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: '#94a3b8',
          marginBottom: 1
        }}
      >
        {asset?.symbol ?? '—'}
      </Text>
      <Animated.Text
        style={[
          {
            color: '#f8fafc',
            fontSize: 16,
            fontWeight: '300',
          },
          priceAnimatedStyle,
        ]}
        numberOfLines={1}
      >
        {formatCurrency(asset?.price)}
      </Animated.Text>
      <View sx={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text sx={{ fontSize: 12, fontWeight: '600', color: changeColor }}>
          {hasChange ? formatPercent(rangePercent) : '—'}
        </Text>
        <Text sx={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>
          ({Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta).replace('$', '') : '—'})
        </Text>
      </View>
      <View sx={{ marginTop: 3, height: SPARKLINE_HEIGHT }}>
        {!isHistoryLoading && (
          <Sparkline data={sparklineData} />
        )}
      </View>
    </View>
  );
};

export default function MarketPricesWidget({ tickers, sx: customSx }) {
  const colors = useColors();
  const [timeframe, setTimeframe] = useState('1h');
  const router = useRouter();
  const {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
  } = useMarketSnapshot(tickers);

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

  const statusLabel = useMemo(() => {
    if (isUpdating && !isLoading) return 'Updating…';
    if (lastUpdated) {
      const formatted = new Date(lastUpdated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Updated ${formatted}`;
    }
    return null;
  }, [isUpdating, isLoading, lastUpdated]);

  const handleMore = () => {
    router.push({
      pathname: '/(tabs)/(explore)/Markets',
      params: { tickers: normalizedTickers.join(','), timeframe },
    });
  };

  return (
    <View sx={customSx}>
      <View sx={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
        <SectionTitle
          title="Live Markets"
          error={error}
          successIcon={<MaterialCommunityIcons name="signal" size={16} color={colors.success} />}
          errorIcon={<MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />}
        />

        <View sx={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Button
            variant="outline"
            size="xs"
            sx={{
              borderRadius: 'full',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 2
            }}
            textProps={{
              sx: {
                fontSize: 11,
                fontWeight: '600',
                color: 'secondary'
              }
            }}
            onPress={handleMore}
            accessibilityRole="button"
            accessibilityLabel="Open full market view"
          >
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={14}
              color={colors.primary}
            />
            <Text sx={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
              Buy / Sell
            </Text>
          </Button>
        </View>
      </View>

      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        {displayAssets.length ? (
          displayAssets.map((asset, index) => {
            const history = historyData?.[asset?.symbol] ?? [];
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
                key={asset?.id ?? index}
                asset={asset}
                index={index}
                sparklineData={sparklinePoints}
                rangeDelta={rangeDelta}
                rangePercent={rangePercent}
                isHistoryLoading={historyFetching && !history.length}
              />
            );
          })
        ) : (
          <View sx={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text sx={{ fontSize: 14, color: '#94a3b8' }}>No market data</Text>
            )}
          </View>
        )}
      </View>
      <View sx={{ marginTop: 4, alignItems: 'flex-end' }}>
        <TimeFrameSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
      </View>
      <View sx={{ marginTop: 4 }}>
        <SectionTitle title="Top Agents" sx={{ color: 'foreground', fontWeight: '500' }} />
        <SvgChart timeframe={timeframe} />
      </View>
    </View>
  );
}