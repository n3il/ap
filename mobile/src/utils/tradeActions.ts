/**
 * Formats trade action strings into human-readable labels
 * @param {string} action - The trade action (e.g., "OPEN_BTC_LONG", "CLOSE_ETH_SHORT", "NO_ACTION")
 * @returns {string} Formatted label
 */
export function formatTradeActionLabel(action) {
  if (!action) return "No Action";

  const actionUpper = action.toUpperCase();

  // Handle NO_ACTION
  if (actionUpper === "NO_ACTION") {
    return "No Action";
  }

  // Parse action parts (e.g., OPEN_BTC_LONG -> OPEN, BTC, LONG)
  const parts = actionUpper.split("_");

  // Extract action type (OPEN, CLOSE)
  const actionType = parts[0];

  // Extract position type (LONG, SHORT) - usually last part
  const positionType = parts[parts.length - 1];

  // Extract asset (everything in between)
  const asset = parts.slice(1, -1).join("-");

  // Build formatted string
  let label = "";

  if (actionType === "OPEN") {
    label = "Open";
  } else if (actionType === "CLOSE") {
    label = "Close";
  } else {
    label = actionType.charAt(0) + actionType.slice(1).toLowerCase();
  }

  if (asset) {
    label += ` ${asset}`;
  }

  if (positionType === "LONG") {
    label += " Long";
  } else if (positionType === "SHORT") {
    label += " Short";
  }

  return label;
}

/**
 * Gets the variant/color for a trade action badge
 * @param {string} action - The trade action
 * @returns {string} Badge variant ('success', 'error', 'warning', 'muted')
 */
export function getTradeActionVariant(action) {
  if (!action) return "muted";

  const actionUpper = action.toUpperCase();

  if (actionUpper === "NO_ACTION") {
    return "muted";
  }

  if (actionUpper.includes("LONG") || actionUpper.includes("OPEN")) {
    return "success";
  }

  if (actionUpper.includes("SHORT")) {
    return "error";
  }

  if (actionUpper.includes("CLOSE")) {
    return "warning";
  }

  return "muted";
}
