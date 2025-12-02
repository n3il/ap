import { GlassView } from "expo-glass-effect";
import { Pressable, View, ViewProps } from "react-native";
import Text from "@/components/ui/Text";
import { useColors } from "@/theme";

const styleVariants = {
  default: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  paddedFull: {
    paddingHorizontal: 8,
    paddingVertical: 14,
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
  const pressableStyle = styleVariants[styleVariant as keyof typeof styleVariants] || styleVariants.default;

  const PressableComponent = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[{flexGrow: 1}, pressableStyle, style]}
    >
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
            marginHorizontal: 4,
          },
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
  );
}
