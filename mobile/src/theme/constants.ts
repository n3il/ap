/**
 * Layout spacing constants
 * Use these for consistent spacing throughout the app
 */
export const LAYOUT = {
  CONTAINER_PADDING: 16,
  SECTION_SPACING: 12,
  ITEM_GAP: 8,
  SCREEN_PADDING: 16,
  CARD_PADDING: 16,
  MODAL_PADDING: 20,
} as const;

/**
 * Common spacing values (Dripsy tokens)
 */
export const SPACING = {
  XXS: 0.5, // 2px
  XS: 1, // 4px
  SM: 2, // 8px
  MD: 3, // 12px
  LG: 4, // 16px
  XL: 6, // 24px
  XXL: 8, // 32px
} as const;

/**
 * Border radius values (Dripsy tokens)
 */
export const RADIUS = {
  XS: "xs", // 4px
  SM: "sm", // 6px
  MD: "md", // 8px
  LG: "lg", // 12px
  XL: "xl", // 16px
  XXL: "2xl", // 20px
  XXXL: "3xl", // 24px
  FULL: "full",
  NONE: "none",
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
} as const;

/**
 * Animation durations (ms)
 */
export const DURATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
} as const;

/**
 * Opacity values
 */
export const OPACITY = {
  DISABLED: 0.4,
  SUBTLE: 0.6,
  MEDIUM: 0.8,
  FULL: 1,
} as const;
