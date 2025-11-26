import baseTheme from "./base";
import lightTheme from "./light";

function hexToRgbString(hex: string) {
  hex = hex.replace("#", "");
  // Handle 3-char shorthand (e.g., #fff -> #ffffff)
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  // Handle 8-char hex with alpha (e.g., #rrggbbaa -> #rrggbb)
  if (hex.length === 8) hex = hex.substring(0, 6);
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

function flatten(
  obj: Record<string, any>,
  prefix = "",
  transformValue = (v: any) => v,
) {
  const res: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(res, flatten(value, newKey, transformValue));
    } else {
      res[`--${newKey}`] = transformValue(value);
    }
  }
  return res;
}

function makeColorVars(colors: Record<string, any>) {
  return flatten(colors, "color", (v: string) =>
    typeof v === "string" && v.startsWith("#") ? hexToRgbString(v) : v,
  );
}

const fontVars = Object.entries(baseTheme.fontSize).reduce(
  (acc, [k, v]) => {
    const [size, opts] = v as [string, { lineHeight: string }];
    acc[`--font-${k}-size`] = size;
    acc[`--font-${k}-line`] = opts.lineHeight;
    return acc;
  },
  {} as Record<string, string>,
);

const radiusVars = flatten(baseTheme.borderRadius, "radius");
const spacingVars = flatten(baseTheme.spacing, "spacing");

const lightVars = {
  ...makeColorVars(lightTheme.colors),
  ...fontVars,
  ...radiusVars,
  ...spacingVars,
};

const darkVars = {
  ...makeColorVars(baseTheme.colors),
  ...fontVars,
  ...radiusVars,
  ...spacingVars,
};

export const themes = {
  default: {
    light: lightVars,
    dark: darkVars,
  },
};
