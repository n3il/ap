import { GlassView } from "expo-glass-effect";
import { Pressable, View } from "react-native";
import Text from "@/components/ui/Text";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

const styleVariants = {
  default: {},
  paddedFull: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 0,
    flexGrow: 1,
    justifyContent: "center",
    alignContent: "center",
    flexDirection: "row",
  },
};

export default function GlassButton({
  children,
  disabled = false,
  enabled = true,
  onPress = () => {},
  style = {},
  styleVariant = "default",
  ...props // glassProps
}) {
  const { colors } = useColors();

  const PressableComponent = (
    <Pressable onPress={onPress} disabled={disabled}>
      {typeof children === "string" ? (
        <Text style={{ fontWeight: "600", textAlign: "center" }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );

  if (!enabled)
    return (
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
    );

  return (
    <GlassView
      glassEffectStyle="clear"
      style={[
        {
          borderRadius: 32,
          paddingHorizontal: 8,
          paddingVertical: 8,
          marginHorizontal: 4,
          ...styleVariants[styleVariant],
        },
        style,
      ]}
      tintColor={colors.glassTint}
      isInteractive
      {...props}
    >
      {PressableComponent}
    </GlassView>
  );
}
