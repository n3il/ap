import type React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SxProp, View } from "dripsy";
// import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "@/contexts/ThemeContext";

// import { Gradient } from 'dripsy/gradient'

type ContainerViewProps = SxProp & {
  children: React.ReactNode;
  noSafeArea?: boolean;
  transparent?: boolean;
};

export const GLOBAL_PADDING = 12;

export default function ContainerView({
  children,
  style,
  noSafeArea,
  transparent,
  ...props
}: ContainerViewProps) {
  const {
    theme: { colors },
    isDark
  } = useTheme();

  console.log({ isDark })

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: "backgroundSecondary",
      }}
      {...props}
      style={style}
    >
      {noSafeArea ? (
        children
      ) : (
        <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
      )}
    </View>
  );
}

export function PaddedView({
  as: ViewComponent = View,
  children,
  sx,
  style = {},
  both = false,
  ...props
}: ViewProps & {
  as?: React.ComponentType<ViewProps>;
  both?: boolean;
}) {
  return (
    <ViewComponent
      {...props}
      sx={sx}
      style={[
        {
          paddingHorizontal: GLOBAL_PADDING,
          paddingVertical: both ? GLOBAL_PADDING : 0,
        },
        style,
      ]}
    >
      {children}
    </ViewComponent>
  );
}
