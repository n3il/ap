import { corsPreflightResponse, successResponse, handleError } from '../_shared/lib/http.ts';
import { validateUserAuth } from '../_shared/lib/auth.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { validateAgentInput, createAgent } from '../_shared/lib/agent.ts';

console.log('Create Agent function started');

/**
 * Main handler for creating a new agent
 */
async function handleCreateAgent(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const userId = await validateUserAuth(authHeader);

  const supabase = createSupabaseClient(authHeader);
  const body = await req.json();

  const input = validateAgentInput(body);
  const agent = await createAgent(supabase, userId, input);

  return {
    success: true,
    agent,
  };
}

/**
 * HTTP handler for the create agent function
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    const result = await handleCreateAgent(req);
    return successResponse(result);
  } catch (error) {
    console.error('Error in create_agent:', error);
    return handleError(error);
  }
});
