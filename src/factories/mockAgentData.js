/**
 * Mock Agent Data Factory
 * Centralized mock data generation for agent performance charts
 */

// Provider brand colors - neon versions
export const PROVIDER_COLORS = {
  openai: '#00ff9f',
  anthropic: '#ff6b35',
  deepseek: '#00d4ff',
  google: '#0099ff',
  gemini: '#0099ff',
  meta: '#0080ff',
  llama: '#0080ff',
  mistral: '#ffaa00',
  cohere: '#00ffcc',
  default: '#94a3b8',
};

export const getProviderColor = (llmProvider) => {
  if (!llmProvider) return PROVIDER_COLORS.default;
  const provider = llmProvider.toLowerCase();
  return PROVIDER_COLORS[provider] || PROVIDER_COLORS.default;
};

// Factory agents for when no agents are configured
export const FACTORY_AGENTS = [
  {
    id: 'factory-1',
    name: 'Agent Alpha',
    llm_provider: 'openai',
  },
  {
    id: 'factory-2',
    name: 'Agent Beta',
    llm_provider: 'anthropic',
  },
  {
    id: 'factory-3',
    name: 'Agent Gamma',
    llm_provider: 'deepseek',
  },
];

/**
 * Format timestamp based on timeframe
 */
export const formatTimestamp = (timestamp, timeframe) => {
  const date = new Date(timestamp);

  switch (timeframe) {
    case '1h':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '24h':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case '30d':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
};

/**
 * Generate mock PnL data points based on timeframe
 * Returns data with timestamp, value, and label
 */
export const generateMockData = (timeframe, agentConfig) => {
  const now = Date.now();
  let dataPoints = 20;
  let intervalMs = 3 * 60 * 1000; // 3 minutes default

  // Determine number of points and interval based on timeframe
  switch (timeframe) {
    case '1h':
      dataPoints = 20;
      intervalMs = 3 * 60 * 1000; // 3 minutes
      break;
    case '24h':
      dataPoints = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      dataPoints = 28;
      intervalMs = 6 * 60 * 60 * 1000; // 6 hours
      break;
    case '30d':
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
  let currentPnl = 0;

  // Create a seed based on agent ID for consistent but different patterns
  const seed = agentConfig?.id ? parseInt(agentConfig.id.replace(/\D/g, '') || '1') : 1;
  const trend = seed === 1 ? 1 : seed === 2 ? 0.5 : -0.3; // Different trends per agent
  const volatility = 0.8;

  for (let i = 0; i < dataPoints; i++) {
    const time = i / (dataPoints - 1); // Normalize to 0-1

    // Add trend and random walk
    const change = trend * 0.15 + (Math.random() - 0.5) * volatility;
    currentPnl = Math.max(-15, Math.min(15, currentPnl + change)); // Clamp for realistic range

    data.push({
      time,
      percent: currentPnl,
    });
  }

  return data;
};

/**
 * Get mock agents with generated data for GiftedChart
 */
export const getMockAgentsForGiftedChart = (timeframe = '1h') => {
  return FACTORY_AGENTS.map(agent => ({
    id: agent.id,
    name: agent.name,
    llm_provider: agent.llm_provider,
    color: getProviderColor(agent.llm_provider),
    data: generateMockData(timeframe, agent),
  }));
};

/**
 * Get mock agents with normalized data for SvgChart
 */
export const getMockAgentsForSvgChart = () => {
  return FACTORY_AGENTS.map(agent => ({
    id: agent.id,
    name: agent.name,
    llm_provider: agent.llm_provider,
    color: getProviderColor(agent.llm_provider),
    data: generateNormalizedMockData(agent),
  }));
};
