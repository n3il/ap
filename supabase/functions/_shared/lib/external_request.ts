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
}

export function recordExternalRequest(context: ExternalRequestContext) {
  Sentry.setContext('external_request', context);
}

export async function externalFetch(
  url: string,
  init: RequestInit = {},
  context?:
    | ExternalRequestContext
    | ((response: Response) => ExternalRequestContext | Promise<ExternalRequestContext>),
): Promise<Response> {
  const method = init.method ?? 'GET';

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

        span.setAttribute('http.response.status_code', response.status);
        const contentLength = Number(response.headers.get('content-length'));
        if (!Number.isNaN(contentLength)) {
          span.setAttribute('http.response_content_length', contentLength);
        }

        const resolvedContext =
          typeof context === 'function' ? await context(response.clone()) : context;

        recordExternalRequest({
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          ...resolvedContext,
        });

        return response;
      } catch (error) {
        span.setAttribute('error', true);
        recordExternalRequest({
          url,
          method,
          statusText: 'network_error',
          ...(context && typeof context !== 'function' ? context : {}),
        });
        throw error;
      }
    },
  );
}
