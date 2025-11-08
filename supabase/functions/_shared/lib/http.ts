import { corsHeaders } from '../cors.ts';

/**
 * Creates a successful JSON response
 */
export function successResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

/**
 * Creates an error JSON response
 */
export function errorResponse(
  error: string | Error,
  status: number = 500
): Response {
  const message = typeof error === 'string' ? error : error.message;

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

/**
 * Creates a CORS preflight response
 */
export function corsPreflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}

/**
 * Determines HTTP status code from error message
 */
export function getStatusFromError(error: Error): number {
  const message = error.message.toLowerCase();

  if (message.includes('unauthorized') || message.includes('no authorization')) {
    return 401;
  }
  if (message.includes('not found')) {
    return 404;
  }
  if (message.includes('missing') || message.includes('required') || message.includes('invalid')) {
    return 400;
  }

  return 500;
}

/**
 * Handles errors with appropriate status codes
 */
export function handleError(error: Error): Response {
  const status = getStatusFromError(error);
  console.error(`Error (${status}):`, error);
  return errorResponse(error, status);
}
