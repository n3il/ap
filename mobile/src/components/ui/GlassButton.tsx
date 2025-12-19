import { View } from "dripsy";
import { GlassView, type GlassViewProps } from "expo-glass-effect";
import { Pressable } from "react-native";
import Text from "@/components/ui/Text";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

const styleVariants = {
  default: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  none: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  square: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  minimal: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    justifyContent: "center",
    alignContent: "center",
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

export interface GlassButtonProps extends GlassViewProps {
  children: React.ReactNode;
  disabled?: boolean;
  enabled?: boolean;
  onPress?: () => void;
  style?: ViewProps["style"];
  styleVariant?: keyof typeof styleVariants;
  buttonProps?: ViewProps;
  tintColor?: string;
}

export default function GlassButton({
  children,
  disabled = false,
  enabled = true,
  onPress = () => {},
  style = {},
  styleVariant = "default",
  buttonProps = {},
  tintColor,
  ...props // glassProps
}: GlassButtonProps) {
  const { colors } = useColors();
  const { theme } = useTheme();
  const pressableStyle =
    styleVariants[styleVariant as keyof typeof styleVariants] ||
    styleVariants.default;

  const PressableComponent = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[{ flexGrow: 1 }, pressableStyle]}
      {...buttonProps}
    >
      <View sx={{ color: colors.surfaceForeground }}>
        {typeof children === "string" ? (
          <Text
            style={{
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );

  if (!enabled)
    return (
      <View
        style={[
          {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 32,
            marginHorizontal: 4,
            backgroundColor: colors.glassTint,
          },
          style,
        ]}
        {...props}
      >
        {PressableComponent}
      </View>
    );

  return (
    <GlassView
      glassEffectStyle="clear"
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 32,
          marginHorizontal: 4,
          // backgroundColor: colors.glassTint,
        },
        theme.isDark && {},
        style,
      ]}
      tintColor={tintColor ?? colors.glassTint}
      isInteractive
      {...props}
    >
      {PressableComponent}
    </GlassView>
  );
}
