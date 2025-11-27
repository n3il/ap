/**
 * Validates that required fields are present in an object
 * Throws error with missing field names if validation fails
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validates that a number is positive
 */
export function validatePositiveNumber(
  value: any,
  fieldName: string
): number {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }

  return num;
}

/**
 * Validates that a value is a valid number
 */
export function validateNumber(
  value: any,
  fieldName: string
): number {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return num;
}

/**
 * Validates an agent ID format
 */
export function validateAgentId(agentId: any): string {
  if (!agentId || typeof agentId !== 'string') {
    throw new Error('Invalid agent_id');
  }
  return agentId;
}

/**
 * Sanitizes metadata objects for JSON storage
 */
export function sanitizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  if (!metadata) return {};

  return JSON.parse(JSON.stringify(metadata));
}
