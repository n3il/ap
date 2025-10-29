import React, { useMemo, useState, useEffect } from 'react';
import { View, Text } from '@/components/ui';
import { Pressable } from 'react-native';
import SectionTitle from '@/components/SectionTitle';
import { useMultiAgentSnapshots } from '@/hooks/useAgentSnapshots';
import { LineChart } from 'react-native-gifted-charts';
import { Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  FACTORY_AGENTS,
  getProviderColor,
  generateMockData,
  formatTimestamp,
} from '@/factories/mockAgentData';

const screenWidth = Dimensions.get('window').width;

// Loading Dots Animation Component
const LoadingDots = () => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const animateDot = (dotOpacity, delay) => {
      dotOpacity.value = withSequence(
        withTiming(0.3, { duration: 0 }),
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      );
    };

    const interval = setInterval(() => {
      animateDot(dot1Opacity, 0);
      setTimeout(() => animateDot(dot2Opacity, 0), 200);
      setTimeout(() => animateDot(dot3Opacity, 0), 400);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  const dotBaseStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
    marginHorizontal: 4,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={[dotBaseStyle, dot1Style]} />
      <Animated.View style={[dotBaseStyle, dot2Style]} />
      <Animated.View style={[dotBaseStyle, dot3Style]} />
    </View>
  );
};

// Animated Legend Item Component
const AnimatedLegendItem = ({ agent, index }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', marginRight: 3, marginBottom: 1 }}>
          <View sx={{ width: 12, height: 12, backgroundColor: agent.color, borderRadius: 2, marginRight: 1 }} />
          <Text sx={{ fontSize: 12, color: '#94a3b8' }}>{agent.name}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Animated Pointer Dot Component
const AnimatedPointerDot = () => {
  const scale = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Initial entrance animation
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });

    // Continuous pulse animation
    const pulse = () => {
      pulseScale.value = withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      );
    };

    pulse();
    const interval = setInterval(pulse, 1600);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#94a3b8',
          borderWidth: 3,
          borderColor: 'rgba(30, 41, 59, 0.9)',
          shadowColor: '#94a3b8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
          elevation: 6,
        }}
      />
    </Animated.View>
  );
};

// Animated Pointer Label Component with entrance animation
const AnimatedPointerLabel = ({ items, chartData }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 250 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const item = items[0];
  if (!item) return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: 'rgba(30, 41, 59, 0.97)',
          borderRadius: 12,
          padding: 14,
          borderWidth: 1.5,
          borderColor: '#475569',
          minWidth: 130,
          maxWidth: 180,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 12,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ color: '#f1f5f9', fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 }}>
        {item.label}
      </Text>
      {chartData.map((agent, idx) => {
        const value = idx === 0 ? item.value : items[idx]?.value;
        if (value === undefined) return null;

        const isPositive = value >= 0;

        return (
          <Animated.View
            key={agent.id}
            entering={FadeInDown.delay(idx * 50).springify()}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: agent.color,
                borderRadius: 2,
                marginRight: 7,
                shadowColor: agent.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
              }}
            />
            <Text style={{ color: '#cbd5e1', fontSize: 10, fontWeight: '600', flex: 1 }}>
              {agent.name}
            </Text>
            <Text style={{
              color: isPositive ? '#10b981' : '#ef4444',
              fontSize: 11,
              fontWeight: '700',
              marginLeft: 6,
            }}>
              {isPositive ? '+' : ''}{value.toFixed(2)}%
            </Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

const GiftedChart = ({ agents: agentConfigs, timeframe = '1h' }) => {
  const agentIds = useMemo(() => agentConfigs?.map(a => a.id) || [], [agentConfigs]);
  const { data: snapshotsData, isLoading, error } = useMultiAgentSnapshots(agentIds, timeframe);
  const [pointerIndex, setPointerIndex] = useState(null);
  const [pointerLabel, setPointerLabel] = useState('');

  console.log({agentConfigs})
  // Process data: use snapshots if available, otherwise generate mock data
  const chartData = useMemo(() => {
    // Use factory agents if no agents are configured
    const agents = (!agentConfigs || agentConfigs.length === 0) ? FACTORY_AGENTS : agentConfigs;

    return agents.map(agent => {
      const agentSnapshots = snapshotsData?.[agent.id];
      let dataPoints;
      console.log({agentSnapshots})

      if (agentSnapshots && agentSnapshots.length > 0) {
        // Use real data from database
        dataPoints = agentSnapshots.map(snapshot => ({
          value: snapshot.pnl_percent || 0,
          timestamp: new Date(snapshot.created_at).getTime(),
          label: formatTimestamp(new Date(snapshot.created_at).getTime(), timeframe),
        }));
      } else {
        // Generate mock data
        dataPoints = generateMockData(timeframe, agent);
      }

      return {
        id: agent.id,
        name: agent.name,
        color: getProviderColor(agent.llm_provider),
        data: dataPoints,
      };
    });
  }, [agentConfigs, snapshotsData, timeframe]);

  // Prepare data for LineChart
  const lineDataSets = useMemo(() => {
    if (chartData.length === 0) return [];

    return chartData.map((agent, index) => ({
      data: agent.data,
      color: agent.color,
      thickness: 2,
      hideDataPoints: true,
      curved: true,
      startOpacity: 0.3,
      endOpacity: 0.1,
      startFillColor: agent.color,
      endFillColor: agent.color,
      areaChart: index === 0, // Only first one shows area
    }));
  }, [chartData]);

  if (isLoading) {
    return (
      <View sx={{ marginTop: 4 }}>
        <SectionTitle title="Top Agents" />
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <LoadingDots />
        </Animated.View>
      </View>
    );
  }

  const primaryData = chartData[0]?.data || [];

  // Safety check - should not happen with factory agents fallback
  if (chartData.length === 0 || primaryData.length === 0) {
    return (
      <View sx={{ marginTop: 4 }}>
        <SectionTitle title="Top Agents" />
        <View sx={{ padding: 4, alignItems: 'center' }}>
          <Text>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View sx={{ marginTop: 4, width: '100%', position: 'relative', maxHeight: 280, overflow: 'hidden' }}>


      {/* Chart */}
      <Animated.View entering={FadeIn.duration(600)} style={{ paddingLeft: 16, paddingRight: 8, position: 'relative', maxHeight: 250, overflow: 'hidden' }}>
        <LineChart
          data={primaryData}
          dataSet={lineDataSets.slice(1)}
          width={screenWidth - 80}
          height={250}
          spacing={Math.max(25, (screenWidth - 120) / Math.max(primaryData.length - 1, 1))}
          color={chartData[0]?.color || '#94a3b8'}
          thickness={2}
          curved
          hideDataPoints
          areaChart
          startOpacity={0.3}
          endOpacity={0.1}
          startFillColor={chartData[0]?.color || '#94a3b8'}
          endFillColor={chartData[0]?.color || '#94a3b8'}
          hideYAxisText={false}
          yAxisColor="#334155"
          yAxisThickness={1}
          yAxisTextStyle={{ color: '#64748b', fontSize: 10, fontWeight: '500' }}
          yAxisSide="right"
          yAxisLabelSuffix="%"
          yAxisOffset={10}
          xAxisColor="#334155"
          xAxisThickness={1}
          hideRules
          rulesColor="#334155"
          rulesThickness={1}
          hideXAxisText
          showVerticalLines={false}
          backgroundColor="transparent"
          initialSpacing={10}
          endSpacing={20}
          pointerConfig={{
            pointerStripHeight: 250,
            pointerStripColor: 'rgba(148, 163, 184, 0.4)',
            pointerStripWidth: 2,
            strokeDashArray: [4, 4],
            pointerColor: '#94a3b8',
            radius: 6,
            pointerLabelWidth: 140,
            pointerLabelHeight: 120,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: false,
            shiftPointerLabelX: -130,
            shiftPointerLabelY: -250,
            pointerVanishDelay: 3000,
            pointerComponent: () => <AnimatedPointerDot />,
            pointerLabelComponent: (items) => (
              <AnimatedPointerLabel items={items} chartData={chartData} />
            ),
          }}
        />
      </Animated.View>
    </View>
  );
};

export default GiftedChart;
