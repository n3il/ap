import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "@/components/ui";
import useRouteAuth from "@/hooks/useRouteAuth";
import { useColors } from "@/theme";

/**
 * Button component that handles route authentication
 * - Shows lock icon when route is not accessible
 * - Disables button when user doesn't have access
 * - Automatically navigates when pressed (if accessible)
 *
 * @param {object} props
 * @param {string} props.href - Route path to navigate to
 * @param {boolean} props.allowUnauthenticated - Override to allow unauthenticated access
 * @param {function} props.onPress - Custom onPress handler (overrides default navigation)
 * @param {boolean} props.disabled - Additional disabled state
 * @param {React.ReactNode} props.children - Button content
 * @param {object} props.style - Button style
 * @param {object} props.sx - Dripsy sx prop
 * @param {boolean} props.showLockIcon - Whether to show lock icon when disabled (default: true)
 */
export default function AuthAwareButton({
  href,
  allowUnauthenticated = false,
  onPress,
  disabled = false,
  children,
  style,
  sx,
  showLockIcon = true,
  ...props
}) {
  const { canAccessRoute } = useRouteAuth();
  const { colors: palette, withOpacity } = useColors();

  // Determine if button should be disabled
  const isAccessible = allowUnauthenticated || !href || canAccessRoute(href);
  const isDisabled = disabled || !isAccessible;

  const handlePress = () => {
    if (isDisabled) return;

    if (onPress) {
      onPress();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <TouchableOpacity
      sx={sx}
      style={[
        style,
        isDisabled && {
          opacity: 0.5,
        },
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      {...props}
    >
      <View
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {children}
        {showLockIcon && !isAccessible && (
          <Ionicons
            name="lock-closed"
            size={16}
            color={withOpacity(palette.foreground ?? palette.textPrimary, 0.7)}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
