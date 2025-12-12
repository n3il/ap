/**
 * LLM Service - Manages LLM model data and provider information
 */

export interface OpenRouterModel {
  slug: string;
  name: string;
  short_name?: string;
  author?: string;
  provider_display_name?: string;
  provider_slug?: string;
  is_free?: boolean;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  models: string[];
}

const OPENROUTER_MODELS_API = 'https://openrouter.ai/api/frontend/models';

/**
 * Fetches available models from OpenRouter API
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_API);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();

    // API response is { data: [...models] }
    const models = data.data || data || [];

    return models;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    // Return empty array on error so the app doesn't crash
    return [];
  }
}

/**
 * Formats a model slug for display
 * Converts "google/gemini-2.0-flash-exp:free" to "Gemini 2.0 Flash (Free)"
 */
export function formatModelName(slug: string): string {
  // Split on "/" to get the model part
  const parts = slug.split('/');
  if (parts.length < 2) return slug;

  const modelPart = parts[1];

  // Split on ":" to separate variant (like ":free")
  const [modelName, variant] = modelPart.split(':');

  // Convert kebab-case to Title Case and clean up
  let formatted = modelName
    .split('-')
    .map(word => {
      // Skip version numbers and common prefixes
      if (word === 'exp' || word === 'preview') return '';
      // Capitalize
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .filter(Boolean)
    .join(' ');

  // Add variant if present
  if (variant) {
    formatted += ` (${variant.charAt(0).toUpperCase() + variant.slice(1)})`;
  }

  return formatted;
}

/**
 * Groups models by provider
 */
export function groupModelsByProvider(models: OpenRouterModel[]): LLMProvider[] {
  const providerMap = new Map<string, Set<string>>();

  models.forEach((model) => {
    // Extract provider from slug (e.g., "google/gemini-2.0-flash" -> "google")
    const parts = model.slug.split('/');
    if (parts.length < 2) return;

    const providerId = parts[0];
    const providerName = model.provider_display_name ||
                        providerId.charAt(0).toUpperCase() + providerId.slice(1);

    if (!providerMap.has(providerId)) {
      providerMap.set(providerId, new Set());
    }

    providerMap.get(providerId)!.add(model.slug);
  });

  // Convert to array and sort by provider name
  return Array.from(providerMap.entries())
    .map(([id, modelSlugs]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      models: Array.from(modelSlugs).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filters models to show only the most popular/useful ones
 */
export function getPopularModels(models: OpenRouterModel[]): OpenRouterModel[] {
  const popularModelSlugs = [
    // Google
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5',
    'google/gemini-pro-1.5',
    // OpenAI
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo',
    'openai/o1-mini',
    // Anthropic
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-haiku',
    // Meta
    'meta-llama/llama-3.3-70b-instruct',
    'meta-llama/llama-3.1-405b-instruct',
    // DeepSeek
    'deepseek/deepseek-chat',
    // Mistral
    'mistralai/mistral-large',
    'mistralai/mistral-medium',
  ];

  return models.filter(model => popularModelSlugs.includes(model.slug));
}

/**
 * Default providers and models for fallback
 */
export const DEFAULT_LLM_PROVIDERS: LLMProvider[] = [
  {
    id: "google",
    name: "Google",
    models: [
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-flash-1.5",
      "google/gemini-pro-1.5",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/gpt-4-turbo",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-haiku",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: ["deepseek/deepseek-chat"],
  },
  {
    id: "meta",
    name: "Meta",
    models: [
      "meta-llama/llama-3.3-70b-instruct",
      "meta-llama/llama-3.1-405b-instruct",
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    models: [
      "mistralai/mistral-large",
      "mistralai/mistral-medium",
    ],
  },
];
