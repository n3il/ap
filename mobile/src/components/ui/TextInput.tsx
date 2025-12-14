import { useDripsyTheme } from "dripsy";
import React from "react";
import type {
  TextInputProps as RNTextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";
import { TextInput as RNTextInput } from "react-native";
import { useColors } from "@/theme";
import type { AppTheme } from "@/theme/dripsy";

export interface TextInputProps extends RNTextInputProps {
  tone?: "default" | "muted";
}

const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ tone = "default", style, placeholderTextColor, ...props }, ref) => {
    const { theme } = useDripsyTheme();
    const { colors: palette } = useColors();
    const typedTheme = theme as AppTheme;

    const baseStyle: TextStyle & ViewStyle = {
      flex: 1,
      backgroundColor: palette.backgroundColor,
      borderColor: palette.borderColor,
      color: palette.textColor,
      borderWidth: 1,
      borderRadius: typedTheme.radii?.xl ?? 16,
      paddingHorizontal: typedTheme.space?.["4"] ?? 16,
      paddingVertical: typedTheme.space?.["3"] ?? 12,
      fontSize: typedTheme.text?.body?.fontSize ?? 16,
    };

    const mergedStyle: Array<TextStyle | ViewStyle> = [baseStyle];

    if (style) {
      if (Array.isArray(style)) {
        mergedStyle.push(...style);
      } else {
        mergedStyle.push(style);
      }
    }

    return (
      <RNTextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? palette.placeholder}
        style={mergedStyle}
        {...props}
      />
    );
  },
);

TextInput.displayName = "TextInput";

export default TextInput;
