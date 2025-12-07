import initSentry from '../sentry.ts';

const Sentry = initSentry();

export interface ExternalRequestContext {
  name?: string;
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  metadata?: Record<string, unknown>;
  duration?: number;
  error?: string;
  path?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

const HEADER_BLOCKLIST = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'api-key',
  'x-api-key',
  'apikey',
]);

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (!HEADER_BLOCKLIST.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  });
  return sanitized;
}

export function recordExternalRequest(context: ExternalRequestContext) {
  const level = context.status && context.status >= 400 ? 'error' : context.error ? 'error' : 'info';

  Sentry.addBreadcrumb({
    category: "external_request",
    level,
    data: context,
  });

  // Console log for immediate visibility in function logs
  const logPrefix = `[External Request] ${context.method || 'GET'} ${context.path || context.url}`;
  const logData = {
    status: context.status,
    duration: context.duration ? `${context.duration}ms` : undefined,
    name: context.name,
    error: context.error,
  };

  if (level === 'error') {
    console.error(logPrefix, logData);
  } else {
    console.log(logPrefix, logData);
  }
}

export async function externalFetch(
  url: string,
  init: RequestInit = {},
  context?:
    | ExternalRequestContext
    | ((response: Response) => ExternalRequestContext | Promise<ExternalRequestContext>),
): Promise<Response> {
  const method = init.method ?? 'GET';
  const startTime = Date.now();

  return await Sentry.startSpan(
    { op: 'http.client', name: `${method} ${url}` },
    async (span) => {
      try {
        const parsedURL = new URL(url, 'http://localhost');
        span.setAttribute('http.request.method', method);
        span.setAttribute('server.address', parsedURL.hostname);
        if (parsedURL.port) span.setAttribute('server.port', parsedURL.port);
        span.setAttribute('url.full', parsedURL.toString());

        const response = await fetch(url, init);
        const duration = Date.now() - startTime;

        span.setAttribute('http.response.status_code', response.status);
        const contentLength = Number(response.headers.get('content-length'));
        if (!Number.isNaN(contentLength)) {
          span.setAttribute('http.response_content_length', contentLength);
        }

        const resolvedContext =
          typeof context === 'function' ? await context(response.clone()) : context;

        recordExternalRequest({
          url,
          path: parsedURL.pathname,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          requestHeaders: init.headers ? sanitizeHeaders(new Headers(init.headers)) : undefined,
          responseHeaders: sanitizeHeaders(response.headers),
          ...resolvedContext,
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        span.setAttribute('error', true);

        const parsedURL = new URL(url, 'http://localhost');
        const errorMessage = error instanceof Error ? error.message : String(error);

        recordExternalRequest({
          url,
          path: parsedURL.pathname,
          method,
          statusText: 'network_error',
          error: errorMessage,
          duration,
          requestHeaders: init.headers ? sanitizeHeaders(new Headers(init.headers)) : undefined,
          ...(context && typeof context !== 'function' ? context : {}),
        });
        throw error;
      }
    },
  );
}
