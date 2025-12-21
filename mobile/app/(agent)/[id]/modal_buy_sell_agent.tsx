import { Button, Dimensions, View, Text } from "@/components/ui";
import { useState, useMemo } from "react";
import { StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/theme";
import Keypad from "@/components/Keypad";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, ZoomIn, ZoomOut } from "react-native-reanimated";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

export default function BuySellAgentModal() {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { colors: palette, withOpacity } = useColors();

  const handleKeyPress = (val: string) => {
    if (val === "." && amount.includes(".")) return;
    if (amount === "0" && val !== ".") {
      setAmount(val);
      return;
    }
    // Limit to 2 decimal places and reasonable length
    if (amount.includes(".") && amount.split(".")[1].length >= 2) return;
    if (amount.length > 9) return;

    setAmount(prev => prev + val);
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleToggleMode = (newMode: 'buy' | 'sell') => {
    if (mode !== newMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMode(newMode);
    }
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log(`${mode === 'buy' ? 'Buying' : 'Selling'}: `, { agentId: id, amount: parseFloat(amount) });
    router.back();
  };

  const displayAmount = amount || "0";

  return (
    <View sx={{ flex: 1, backgroundColor: "background" }}>
      {/* Header / Toggle */}
      <View sx={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 4,
        paddingBottom: 4
      }}>
        <View sx={{
          flexDirection: 'row',
          backgroundColor: withOpacity(palette.surfaceLight, 0.1),
          borderRadius: "2xl",
          padding: 1,
          width: 200,
        }}>
          <TouchableOpacity
            onPress={() => handleToggleMode('buy')}
            style={[
              styles.toggleBtn,
              mode === 'buy' && { backgroundColor: palette.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
            ]}
          >
            <Text sx={{
              fontWeight: '600',
              color: mode === 'buy' ? "textPrimary" : "textSecondary",
              fontSize: 14
            }}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleMode('sell')}
            style={[
              styles.toggleBtn,
              mode === 'sell' && { backgroundColor: palette.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
            ]}
          >
            <Text sx={{
              fontWeight: '600',
              color: mode === 'sell' ? "textPrimary" : "textSecondary",
              fontSize: 14
            }}>Sell</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Display Area */}
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text sx={{ fontSize: 56, lineHeight: 56, fontWeight: '700', color: "textPrimary" }}>$</Text>
          <Text sx={{
            fontSize: 64,
            lineHeight: 64,
            fontWeight: '700',
            color: "textPrimary",
            marginLeft: 1
          }}>
            {displayAmount}
          </Text>
          {/* Animated Cursor */}
          <Animated.View
            entering={FadeIn}
            style={{
              width: 3,
              height: 50,
              backgroundColor: palette.primary,
              marginLeft: 8,
              borderRadius: 2
            }}
          />
        </View>
        <Text variant="sm" tone="muted" sx={{ marginTop: 2 }}>
          Available: $12,450.00
        </Text>
      </View>

      {/* Keypad */}
      <View sx={{ paddingBottom: insets.bottom + 20 }}>
        <Keypad onPress={handleKeyPress} onDelete={handleDelete} />

        {/* Action Button */}
        {amount.length > 0 && parseFloat(amount) > 0 && (
          <Animated.View
            entering={ZoomIn}
            exiting={ZoomOut}
            style={{ paddingHorizontal: 20, marginTop: 10 }}
          >
            <Button
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              sx={{ height: 60, borderRadius: "2full" }}
            >
              Review {mode === 'buy' ? 'Buy' : 'Sell'}
            </Button>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
