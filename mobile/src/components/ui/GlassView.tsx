import { GlassView } from "expo-glass-effect";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/theme";

type GlassButtonProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  onPress: () => void;
} & Omit<ComponentProps<typeof GlassView>, "style" | "children">;

export default function GlassButton({
  style,
  children,
  onPress,
  ...props
}: GlassButtonProps) {
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
