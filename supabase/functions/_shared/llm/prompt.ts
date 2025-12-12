import type { LLMPrompt } from './types.ts';

export interface PromptTemplateInput {
  system_instruction: string;
  user_template: string;
}

/**
 * Builds an LLM prompt by replacing template variables with context values
 *
 * Available template variables:
 * - {{ACCOUNT_SUMMARY}} - Current account state and positions
 * - {{TRADEABLE_ASSETS}} - Available assets for trading
 * - {{CANDLE_DATA}} - Historical price data
 * - {{TIMESTAMP}} - Current timestamp
 * - {{PROMPT_DIRECTION}} - Custom agent-specific instructions
 */
export function buildPrompt(
  template: PromptTemplateInput,
  context: Record<string, any>
): LLMPrompt {
  const replacements: Record<string, string> = {
    ACCOUNT_SUMMARY: JSON.stringify(context.accountSummary || {}),
    TRADEABLE_ASSETS: JSON.stringify(context.tradeableAssets || []),
    CANDLE_DATA: JSON.stringify(context.candleData || {}),
    TIMESTAMP: new Date().toISOString(),
    PROMPT_DIRECTION: context.promptDirection || '',
  };

  let userQuery = template.user_template;
  for (const [token, value] of Object.entries(replacements)) {
    userQuery = userQuery.replace(new RegExp(`{{${token}}}`, 'g'), value);
  }

  const systemInstruction = template.system_instruction;

  return { systemInstruction, userQuery };
}
