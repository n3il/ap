import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, Button, Image } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';
import { useRouter } from 'expo-router';
import { useMarketPrices } from '@/hooks/useMarketPrices';

export default function ExploreHeader({
  tickers,
  sx: customSx,
  timeframe
}) {
  const compact = true;
  const { colors } = useColors();
  const router = useRouter();
  const {
    normalizedTickers,
    assets,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
  } = useMarketPrices(tickers);

  const statusLabel = useMemo(() => {
    if (isUpdating && !isLoading) return 'Updating…';
    if (lastUpdated) {
      const formatted = new Date(lastUpdated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${formatted}`;
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
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: compact ? 1 : 2,
      }}
    >
      <View sx={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        justifyContent: 'space-between',
      }}>
        <View sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2.5,
        }}>
          <Image
            source={require('@assets/puppet-bare-icon-w-s.svg')}
            style={{
              width: 30,
              height: 30,
            }}
            contentFit="contain"
            tintColor={colors.accent700}
          />
          <Text sx={{
            fontSize: 16,
            fontWeight: '600',
            color: 'accent700',
            letterSpacing: 3,
          }}>
            {process.env.EXPO_PUBLIC_APP_NAME}
          </Text>
        </View>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : error ? (
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
          ) : (
            <MaterialCommunityIcons name="signal" size={16} color={colors.success} />
          )}
          {statusLabel && (
            <Text sx={{ fontSize: 11, color: 'mutedForeground' }}>
              {statusLabel}
            </Text>
          )}
          {!compact && (
            <Button
              variant="outline"
              size="xs"
              sx={{
                borderRadius: 'full',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 2,
                gap: 1,
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
              <Text sx={{ fontSize: 11, fontWeight: '600', color: 'primary' }}>
                Buy / Sell
              </Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}