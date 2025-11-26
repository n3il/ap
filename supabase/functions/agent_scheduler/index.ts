import { successResponse, handleError } from '../_shared/lib/http.ts';
import { fetchActiveAgents, runWithConcurrency } from './lib/scheduler.ts';
import initSentry from "../_shared/sentry.ts";

const Sentry = initSentry();
Sentry.setTag('edge_function', 'agent_scheduler');

const CONCURRENCY_LIMIT = 50;

/**
 * Main scheduler orchestration
 * Fetches active agents and triggers assessments with controlled concurrency
 */
async function runScheduler() {
  const activeAgents = await fetchActiveAgents();

  if (activeAgents.length === 0) {
    return {
      success: true,
      message: 'No active agents to process',
      processed: 0,
    };
  }

  await runWithConcurrency(activeAgents, CONCURRENCY_LIMIT);

  console.log(`✓ Scheduler dispatched ${activeAgents.length} agent assessments`);

  return {
    success: true,
    message: `Triggered ${activeAgents.length} agent assessments asynchronously`,
    total: activeAgents.length,
    concurrency: CONCURRENCY_LIMIT,
  };
}

/**
 * HTTP handler for the scheduler cron job
 */
Deno.serve(async (_req) => {
  try {
    const result = await runScheduler();

    return successResponse(result);
  } catch (error) {
    Sentry.captureException(error);
    return handleError(error as Error);
  }
});
