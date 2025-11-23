import { View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { GlassView } from "expo-glass-effect";
import { Pressable } from "react-native";
import { Text } from "@/components/ui";

export default function GlassButton ({
  style = {},
  onPress = () => {},
  children,
  enabled = true,
  ...props
}) {
  const { colors, withOpacity } = useColors();

  const PressableComponent = (
      <Pressable
        onPress={onPress}
      >
        {(typeof children === "string")
        ? <Text style={{ fontWeight: '600', textAlign: 'center' }}>{children}</Text>
        : children}
      </Pressable>
  )

  if (!enabled) return (
    <View
      style={[
        {
          borderRadius: 32,
          paddingHorizontal: 8,
          paddingVertical: 8,
          marginHorizontal: 4,
        },
        style,
      ]}
    >
      {PressableComponent}
    </View>
  )

  return (
    <GlassView
      glassEffectStyle="clear"
      style={[
        {
          borderRadius: 32,
          paddingHorizontal: 8,
          paddingVertical: 8,
          marginHorizontal: 4,
        },
        style,
      ]}
      tintColor={colors.glassTint}
      isInteractive
      {...props}
    >
      {PressableComponent}
    </GlassView>
  )
}