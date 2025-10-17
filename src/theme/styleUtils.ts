import type { SxProp } from 'dripsy';

/**
 * Common style patterns for reuse across components
 */

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Flex shortcuts
export const flex = {
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  } as SxProp,
  centerX: {
    alignItems: 'center',
  } as SxProp,
  centerY: {
    justifyContent: 'center',
  } as SxProp,
  between: {
    justifyContent: 'space-between',
  } as SxProp,
  around: {
    justifyContent: 'space-around',
  } as SxProp,
  evenly: {
    justifyContent: 'space-evenly',
  } as SxProp,
  row: {
    flexDirection: 'row',
  } as SxProp,
  column: {
    flexDirection: 'column',
  } as SxProp,
  wrap: {
    flexWrap: 'wrap',
  } as SxProp,
} as const;

// Position shortcuts
export const position = {
  absolute: {
    position: 'absolute',
  } as SxProp,
  relative: {
    position: 'relative',
  } as SxProp,
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as SxProp,
} as const;

// Common layout patterns
export const layout = {
  fullWidth: {
    width: '100%',
  } as SxProp,
  fullHeight: {
    height: '100%',
  } as SxProp,
  fullScreen: {
    width: '100%',
    height: '100%',
  } as SxProp,
  container: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  } as SxProp,
  containerLg: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  } as SxProp,
} as const;

// Text utilities
export const text = {
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as SxProp,
  center: {
    textAlign: 'center',
  } as SxProp,
  right: {
    textAlign: 'right',
  } as SxProp,
  left: {
    textAlign: 'left',
  } as SxProp,
} as const;

// Border utilities
export const border = {
  all: {
    borderWidth: 1,
    borderColor: 'border',
  } as SxProp,
  top: {
    borderTopWidth: 1,
    borderColor: 'border',
  } as SxProp,
  bottom: {
    borderBottomWidth: 1,
    borderColor: 'border',
  } as SxProp,
  left: {
    borderLeftWidth: 1,
    borderColor: 'border',
  } as SxProp,
  right: {
    borderRightWidth: 1,
    borderColor: 'border',
  } as SxProp,
} as const;

// Combine multiple style utilities
export const combine = (...styles: SxProp[]): SxProp => {
  return Object.assign({}, ...styles);
};

/**
 * Helper to create responsive padding
 */
export const createPadding = (all?: number, horizontal?: number, vertical?: number, top?: number, right?: number, bottom?: number, left?: number): SxProp => {
  return {
    ...(all !== undefined && { padding: all }),
    ...(horizontal !== undefined && { paddingHorizontal: horizontal }),
    ...(vertical !== undefined && { paddingVertical: vertical }),
    ...(top !== undefined && { paddingTop: top }),
    ...(right !== undefined && { paddingRight: right }),
    ...(bottom !== undefined && { paddingBottom: bottom }),
    ...(left !== undefined && { paddingLeft: left }),
  };
};

/**
 * Helper to create responsive margin
 */
export const createMargin = (all?: number, horizontal?: number, vertical?: number, top?: number, right?: number, bottom?: number, left?: number): SxProp => {
  return {
    ...(all !== undefined && { margin: all }),
    ...(horizontal !== undefined && { marginHorizontal: horizontal }),
    ...(vertical !== undefined && { marginVertical: vertical }),
    ...(top !== undefined && { marginTop: top }),
    ...(right !== undefined && { marginRight: right }),
    ...(bottom !== undefined && { marginBottom: bottom }),
    ...(left !== undefined && { marginLeft: left }),
  };
};
