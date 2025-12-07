import type { SxProp } from "dripsy";
import { View } from "dripsy";
import type React from "react";
import { formatAmount } from "@/utils/currency";
import Text from "./Text";

export interface LabelValueProps {
  label: string;
  value: number | null | undefined;
  orientation?: "vertical" | "horizontal";
  sx?: SxProp;
  textStyle?: SxProp;
  colorize?: boolean;
  children?: React.ReactNode;
  textVariant?: string;
  formatter?: (value: number, options?: { showSign?: boolean }) => string;
}
export const FormattedValueLabel = ({
  value,
  colorize,
  showSign,
  alignRight,
  valueTextVariant = "body",
  formatter = formatAmount,
  sx = {}
}: {
  value: number;
  colorize?: boolean;
  showSign?: boolean;
  alignRight?: boolean;
  formatter?: (value: number, options?: { showSign?: boolean }) => string;
  valueTextVariant?: string;
  sx?: SxProp;
}) => {
  const formattedValue = !value ? "-" : formatter(value, { showSign });
  return (
    <Text
      variant={valueTextVariant}
      sx={{
        fontWeight: "300",
        fontFamily: "monospace",
        alignSelf: alignRight ? "flex-end" : "flex-start",
        color: "surfaceForeground",

        ...(colorize
          ? {
              color: value > 0 ? "success" : value < 0 ? "error" : "foreground",
            }
          : {}),
        ...sx,
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
  sx = {},
  textVariant = "xs",

  showSign = false,
  colorize,
  alignRight,
  valueTextVariant = "body",
  formatter = formatAmount,

  children,
}: LabelValueProps & {
  textVariant?: string;
  showSign?: boolean;
  alignRight?: boolean;
  valueTextVariant?: string;
  formatter?: (value: number, options?: { showSign?: boolean }) => string;
}) => {
  return (
    <View
      sx={{
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: orientation === "vertical" ? 1 : 2,
        alignItems: orientation === "vertical" ? "flex-start" : "center",
        justifyContent: alignRight ? "flex-end" : "flex-start",
        ...sx,
      }}
    >
      <Text
        variant={textVariant}
        tone="muted"
        sx={{
          fontFamily: "monospace",
          alignSelf: alignRight ? "flex-end" : "flex-start",
          color: "surfaceForeground",
          opacity: .7
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
            marginLeft: alignRight ? 'auto': '0',
          }}
        >
          {<FormattedValueLabel
            value={value}
            colorize={colorize}
            formatter={formatter}
            showSign={showSign}
            alignRight={alignRight}
            valueTextVariant={valueTextVariant}
          />}
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
};

export default LabelValue;
