import * as Sentry from '@sentry/deno'

export default function initSentry() {
  Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
    defaultIntegrations: false,
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  })
  // Set region and execution_id as custom tags
  Sentry.setTag('region', Deno.env.get('SB_REGION'))
  Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'))
  Sentry.setTag('execution_id', Deno.env.get('DENO_DEPLOYMENT_ID'))
  return Sentry;
}
