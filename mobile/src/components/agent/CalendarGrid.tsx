import React, { useState, useMemo } from "react";
import { View, Text } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount } from "@/utils/currency";
import { format } from "date-fns";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, useSharedValue, runOnJS } from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

export interface CalendarBucket {
  value: number;
  date: Date;
  isEmpty: boolean;
  label?: string; // e.g. "HH:mm" or "d"
}

interface CalendarGridProps {
  buckets: CalendarBucket[];
  showLabel?: boolean;
  label?: string;
  colorMode: 'pnl' | 'sentiment';
  showIcon?: boolean;
  formatter?: (val: number) => string;
  icon?: string | React.ReactNode;
}

export default function CalendarGrid({
  buckets,
  showLabel = false,
  label,
  colorMode,
  showIcon = true,
  formatter,
  icon = "calendar-outline",
}: CalendarGridProps) {
  const { colors: palette, withOpacity } = useColors();
  const [activeTooltip, setActiveTooltip] = useState<{ index: number; text: string } | null>(null);

  // Shared values for gesture handling
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  const lastActiveIndex = useSharedValue(-1);

  const currentMonthLabel = label || format(new Date(), "MMM yyyy");

  const updateTooltip = (idx: number) => {
    if (idx < 0 || idx >= buckets.length) {
      setActiveTooltip(null);
      return;
    }

    const bucket = buckets[idx];
    const text = format(bucket.date, "MMM d, yyyy HH:mm");

    if (activeTooltip?.index !== idx) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTooltip({ index: idx, text });
    }
  };

  const clearTooltip = () => {
    setActiveTooltip(null);
    lastActiveIndex.value = -1;
  };

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(200)
      .onStart((e) => {
        const numCols = 7;
        const numRows = Math.ceil(buckets.length / numCols);
        const col = Math.floor((e.x / containerWidth.value) * numCols);
        const row = Math.floor((e.y / containerHeight.value) * numRows);
        const index = row * numCols + col;

        if (index >= 0 && index < buckets.length) {
          lastActiveIndex.value = index;
          runOnJS(updateTooltip)(index);
        }
      })
      .onUpdate((e) => {
        const numCols = 7;
        const numRows = Math.ceil(buckets.length / numCols);

        const col = Math.floor((e.x / containerWidth.value) * numCols);
        const row = Math.floor((e.y / containerHeight.value) * numRows);
        const index = row * numCols + col;

        if (index !== lastActiveIndex.value) {
          if (index >= 0 && index < buckets.length) {
            lastActiveIndex.value = index;
            runOnJS(updateTooltip)(index);
          } else {
            runOnJS(clearTooltip)();
          }
        }
      })
      .onEnd(() => {
        runOnJS(clearTooltip)();
      })
      .onFinalize(() => {
        runOnJS(clearTooltip)();
      });
  }, [buckets, containerWidth, containerHeight, activeTooltip]);

  const getColor = (val: number) => {
    if (colorMode === 'pnl') {
      return val > 0 ? palette.long : val < 0 ? palette.short : palette.foreground;
    } else {
      return val > 0 ? palette.long : val < 0 ? palette.short : palette.foreground;
    }
  };

  const defaultFormatter = (val: number) => {
    return formatAmount(val, { precision: 1, minDecimals: 0, showSign: true } as any);
  };

  const activeFormatter = formatter || defaultFormatter;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {showLabel && (
            <>
              <Text style={{ fontSize: 18, fontWeight: '700', color: palette.foreground }}>
                {currentMonthLabel}
              </Text>
              {typeof icon === 'string' ? (
                <MaterialCommunityIcons name={icon as any} size={16} color={palette.foreground} style={{ opacity: 0.8 }} />
              ) : (
                icon
              )}
            </>
          )}
        </View>

        {activeTooltip && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              backgroundColor: withOpacity(palette.surfaceLight, 0.1),
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '600', color: palette.mutedForeground }}>
              {activeTooltip.text}
            </Text>
          </Animated.View>
        )}
      </View>

      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => {
            containerWidth.value = e.nativeEvent.layout.width;
            containerHeight.value = e.nativeEvent.layout.height;
          }}
          style={{
            flexDirection: 'row',
            flexWrap: buckets.length > 7 ? 'wrap' : 'nowrap',
            gap: 6,
          }}
        >
          {showIcon && (
            typeof icon === 'string' ? (
              <MaterialCommunityIcons name={icon as any} size={16} color={palette.foreground} style={{ opacity: 0.8 }} />
            ) : (
              icon
            )
          )}

          {buckets.map((bucket, idx) => {
            const color = getColor(bucket.value);
            const isActive = activeTooltip?.index === idx;

            return (
              <View
                key={idx}
                style={{
                  width: '13%', // Approx 7 columns
                  aspectRatio: 1.8,
                  borderRadius: 4,
                  backgroundColor: bucket.isEmpty
                    ? withOpacity(palette.surfaceLight, 0.05)
                    : withOpacity(color, isActive ? 0.3 : 0.1),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isActive ? 1 : 0,
                  borderColor: withOpacity(color, 0.5),
                }}
              >
                {!bucket.isEmpty && (
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: color,
                  }}>
                    {activeFormatter(bucket.value)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}
