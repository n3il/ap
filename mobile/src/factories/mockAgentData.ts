/**
 * Mock Agent Data Factory
 * Centralized mock data generation for agent performance charts
 */

import { PROVIDER_COLORS } from "@/theme/base";

export const getProviderColor = (llmProvider) => {
  if (!llmProvider) return PROVIDER_COLORS.default;
  const provider = llmProvider.toLowerCase();
  return PROVIDER_COLORS[provider] || PROVIDER_COLORS.default;
};

// Factory agents for when no agents are configured
export const FACTORY_AGENTS = [
  {
    id: "factory-1",
    name: "Agent Alpha",
    llm_provider: "openai",
  },
  {
    id: "factory-2",
    name: "Agent Beta",
    llm_provider: "anthropic",
  },
  {
    id: "factory-3",
    name: "Agent Gamma",
    llm_provider: "deepseek",
  },
];

/**
 * Format timestamp based on timeframe
 */
export const formatTimestamp = (timestamp, timeframe) => {
  const date = new Date(timestamp);

  switch (timeframe) {
    case "1h":
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "24h":
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "7d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "30d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    default:
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
  }
};

/**
 * Generate mock PnL data points based on timeframe
 * Returns data with timestamp, value, and label
 */
export const generateMockData = (timeframe, _agentConfig) => {
  const now = Date.now();
  let dataPoints = 20;
  let intervalMs = 3 * 60 * 1000; // 3 minutes default

  // Determine number of points and interval based on timeframe
  switch (timeframe) {
    case "1h":
      dataPoints = 20;
      intervalMs = 3 * 60 * 1000; // 3 minutes
      break;
    case "24h":
      dataPoints = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case "7d":
      dataPoints = 28;
      intervalMs = 6 * 60 * 60 * 1000; // 6 hours
      break;
    case "30d":
      dataPoints = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    default:
      dataPoints = 20;
      intervalMs = 3 * 60 * 1000;
  }

  const data = [];
  let currentPnl = 0;

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i - 1) * intervalMs;
    // Random walk for PnL: -5% to +5% change per point
    const change = (Math.random() - 0.5) * 10;
    currentPnl = Math.max(-50, Math.min(100, currentPnl + change)); // Clamp between -50% and 100%

    data.push({
      value: currentPnl,
      timestamp,
      label: formatTimestamp(timestamp, timeframe),
    });
  }

  return data;
};

/**
 * Generate normalized mock data for SVG charts (0-1 range for time)
 * Returns data with time (0-1) and percent values
 */
export const generateNormalizedMockData = (agentConfig) => {
  const dataPoints = 40; // More points for smooth curves
  const data = [];
  let currentPnl = 0; // Start at 0%
  const crossoverPoint = Math.floor(dataPoints / 3); // One-third through

  // Create a seed based on agent ID for consistent but different patterns
  const seed = agentConfig?.id
    ? parseInt(agentConfig.id.replace(/\D/g, "") || "1", 10)
    : 1;
  const volatility = 0.6;

  for (let i = 0; i < dataPoints; i++) {
    const time = i / (dataPoints - 1); // Normalize to 0-1

    // Calculate trend to ensure positive by crossover point
    let trend: number;
    if (i < crossoverPoint) {
      // Before crossover: gentle positive trend
      trend = 0.3;
    } else if (i === crossoverPoint) {
      // At crossover: ensure positive if not already
      if (currentPnl <= 0) {
        currentPnl = 0.2;
      }
      trend = 0.3;
    } else {
      // After crossover: maintain positive with agent-specific trend
      trend = seed === 1 ? 0.4 : seed === 2 ? 0.35 : 0.3;
    }

    // Add trend and random walk
    const change = trend * 0.15 + (Math.random() - 0.5) * volatility;
    currentPnl = currentPnl + change;

    // After crossover point, ensure we stay positive
    if (i >= crossoverPoint) {
      currentPnl = Math.max(0.1, Math.min(15, currentPnl));
    } else {
      currentPnl = Math.max(-15, Math.min(15, currentPnl));
    }

    data.push({
      time,
      percent: currentPnl,
    });
  }

  return data;
};

/**
 * Get mock agents with normalized data for SvgChart
 */
export const getMockAgentsForSvgChart = () => {
  return FACTORY_AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    llm_provider: agent.llm_provider,
    color: getProviderColor(agent.llm_provider),
    data: generateNormalizedMockData(agent),
  }));
};
