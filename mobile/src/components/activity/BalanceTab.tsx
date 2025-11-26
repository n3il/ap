import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/components/ui';
import { useColors } from '@/theme';
import SvgChart, { CHART_DATA_SOURCE } from '@/components/SvgChart';
import { useTimeframeStore } from '@/stores/useTimeframeStore';

export default function BalanceTab() {
  const { timeframe, setTimeframe } = useTimeframeStore();
  const { success, withOpacity } = useColors();

  // Fetch user's account balance history (mock for now)
  // TODO: Replace with real account balance query
  const accountBalanceData = null; // Will use mock data from SvgChart

  return (
    <ScrollView
      sx={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >

      <View sx={{ marginBottom: 6 }}>
        <View sx={{}}>
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text sx={{ fontSize: 16, fontWeight: '600', color: 'textPrimary' }}>
              Balance
            </Text>


            <View sx={{ flexDirection: 'row', gap: 2 }}>
              {['1h', '24h', '7d'].map((tf) => (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  sx={{
                    paddingHorizontal: 3,
                    paddingVertical: 1.5,
                    borderRadius: 'md',
                    backgroundColor: timeframe === tf ? withOpacity(success, 0.2) : 'transparent',
                  }}
                >
                  <Text sx={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: timeframe === tf ? 'success' : 'secondary500',
                  }}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <SvgChart
            chartData={{ lines: [] }}
            accountData={accountBalanceData}
          />
        </View>
      </View>
    </ScrollView>
  );
}
