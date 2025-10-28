import React, { useMemo, useState } from 'react';
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
import AgentComparisonLineChart from './AgentComparisonLineChart';

const SPARKLINE_WIDTH = 88;
const SPARKLINE_HEIGHT = 32;

const TIMEFRAME_OPTIONS = [
  { id: '1h', label: '1H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
];

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
      <Text
        sx={{
          color: '#f8fafc',
          fontSize: 18,
          fontWeight: '600'
        }}
        numberOfLines={1}
      >
        {formatCurrency(asset?.price)}
      </Text>
      <View sx={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text sx={{ fontSize: 12, fontWeight: '600', color: changeColor }}>
          {hasChange ? formatPercent(rangePercent) : '—'}
        </Text>
        <Text sx={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>
          ({Number.isFinite(rangeDelta) ? formatCurrency(rangeDelta).replace('$', '') : '—'})
        </Text>
      </View>
      <View sx={{ marginTop: 3 }}>
        {!isHistoryLoading && (
          <Sparkline data={sparklineData} />
        )}
      </View>
    </View>
  );
};

export default function MarketPricesWidget({ tickers, sx: customSx }) {
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
      <View sx={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {error ? (
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={"red"} />
            </View>
          ) : (
            <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <MaterialCommunityIcons name="signal" size={16} color={"green"} />
            </View>
          )}
          <Text
            sx={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: '#94a3b8'
            }}
          >
            Live Markets
          </Text>
        </View>

        <View sx={{ alignItems: 'flex-end' }}>
          <TouchableOpacity
            sx={{
              alignSelf: 'flex-end',
              paddingHorizontal: 3,
              paddingVertical: 6,
              borderRadius: 'full',
              borderWidth: 1,
              borderColor: 'primary',
              marginBottom: 1
            }}
            onPress={handleMore}
            accessibilityRole="button"
            accessibilityLabel="Open full market view"
          >
            <Text sx={{ fontSize: 11, fontWeight: '600', color: '#ffffff' }}>
              All assets
            </Text>
          </TouchableOpacity>
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
        <View sx={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          {TIMEFRAME_OPTIONS.map((option) => {
            const isSelected = timeframe === option.id;
            return (
              <Button
                key={option.id}
                variant="outline"
                onPress={() => setTimeframe(option.id)}
                style={{
                  paddingHorizontal: 2,
                  paddingVertical: 1,
                  borderWidth: 1,
                  borderColor: isSelected ? 'accent' : 'rgba(255, 255, 255, 0.2)',
                  backgroundColor: isSelected ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  marginRight: 2
                }}
                accessibilityRole="button"
                accessibilityLabel={`Set timeframe to ${option.label}`}
                textProps={{
                  sx: {
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: isSelected ? 'accent' : 'rgba(248, 250, 252, 0.3)'
                  }
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </View>

        <AgentComparisonLineChart timeframe={timeframe} />
      </View>
    </View>
  );
}