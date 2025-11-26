import { GlassView } from "expo-glass-effect";
import { Pressable } from "react-native";
import { useColors } from "@/theme";

export default function GlassButton({ style, children, onPress, ...props }) {
  const { colors, withOpacity } = useColors();

  return (
    <GlassView
      glassEffectStyle={"clear"}
      style={[
        {
          borderRadius: 32,
          paddingHorizontal: 8,
          paddingVertical: 8,
          marginHorizontal: 4,
        },
        style,
      ]}
      tintColor={withOpacity(colors.foreground, 0.1)}
      isInteractive
      {...props}
    >
      <Pressable onPress={onPress}>{children}</Pressable>
    </GlassView>
  );
}
