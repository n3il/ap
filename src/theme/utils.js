const HEX_REGEX = /^#?([a-f\d]{6}|[a-f\d]{8}|[a-f\d]{3})$/i;

const expandHex = (hex) => {
  if (hex.length === 3) {
    return hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (hex.length === 8) {
    return hex.slice(0, 6);
  }
  return hex;
};

export const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string' || !HEX_REGEX.test(hex)) {
    return hex;
  }

  let normalized = hex.replace('#', '');
  normalized = expandHex(normalized);

  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const withOpacity = (color, alpha) => {
  if (!color) return `rgba(0, 0, 0, ${alpha})`;
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const parts = color.replace(/rgba?\(|\)/g, '').split(',');
    if (parts.length >= 3) {
      const [r, g, b] = parts.map((part) => parseFloat(part));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return hexToRgba(color, alpha);
};

export const blendColors = (base, overlay, alpha = 0.5) => {
  const baseColor = hexToRgba(base, 1).match(/\d+/g);
  const overlayColor = hexToRgba(overlay, 1).match(/\d+/g);
  if (!baseColor || !overlayColor) return overlay;

  const blended = baseColor.slice(0, 3).map((baseComponent, index) => {
    const overComponent = overlayColor[index];
    return Math.round(
      parseInt(baseComponent, 10) * (1 - alpha) + parseInt(overComponent, 10) * alpha,
    );
  });

  return `rgba(${blended.join(', ')}, 1)`;
};
