import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";
import { formatAmount } from "@/utils/currency";
import Text from "./Text";

export interface LabelValueProps {
  label: string;
  value: number;
  orientation?: "vertical" | "horizontal";
  sx?: SxProp;
  textStyle?: SxProp;
  colorize?: boolean;
  children?: React.ReactNode;
  formatter?: (value: number, options?: { showSign?: boolean }) => string;
}
export const FormattedValueLabel = ({
  value,
  colorize,
  showSign,
  alignRight,
  formatter = formatAmount,
}: {
  value: number;
  colorize?: boolean;
  showSign?: boolean;
  alignRight?: boolean;
  formatter?: (value: number, options?: { showSign?: boolean }) => string;
}) => {
  const formattedValue = !value ? "-" : formatter(value, { showSign });
  return (
    <Text
      variant="body"
      sx={{
        fontWeight: "300",
        fontFamily: "monospace",
        textAlign: alignRight ? "right" : "left",
        flexGrow: 1,
        ...(colorize
          ? {
              color: value > 0 ? "success" : value < 0 ? "error" : "foreground",
            }
          : {}),
      }}
    >
      {formattedValue}
    </Text>
  );
};

const LabelValue: React.FC<LabelValueProps> = ({
  label,
  value,
  orientation = "vertical",
  sx,

  showSign = false,
  colorize,
  alignRight,
  formatter = formatAmount,

  children,
}) => {
  return (
    <View
      sx={{
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: orientation === "vertical" ? 1 : 2,
        alignItems: orientation === "vertical" ? "flex-start" : "center",
        ...sx,
      }}
    >
      <Text
        variant="xs"
        tone="muted"
        sx={{
          fontFamily: "monospace",
          alignSelf: alignRight ? "flex-end" : "flex-start",
        }}
      >
        {label}
      </Text>

      {value !== undefined ? (
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            justifyContent: alignRight ? "flex-end" : "flex-start",
          }}
        >
          <FormattedValueLabel
            value={value}
            colorize={colorize}
            formatter={formatter}
            showSign={showSign}
            alignRight={alignRight}
          />
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
};

export default LabelValue;
