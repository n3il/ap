import { createSupabaseClient, createSupabaseServiceClient } from '../supabase.ts';

export interface AuthContext {
  supabase: any;
  userId: string | null;
  isServiceRequest: boolean;
}

/**
 * Authenticates the request and returns an auth context
 * Supports both user JWT and service key authentication
 */
export async function authenticateRequest(authHeader: string): Promise<AuthContext> {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const isServiceRequest = authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const supabase = isServiceRequest
    ? createSupabaseServiceClient()
    : createSupabaseClient(authHeader);

  let userId: string | null = null;

  if (!isServiceRequest) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized user');
    }
    userId = user.id;
    console.log('User authenticated:', user.id);
  } else {
    console.log('Authenticated as service');
  }

  return { supabase, userId, isServiceRequest };
}

/**
 * Validates user authentication and returns user ID
 * Throws error if authentication fails
 */
export async function validateUserAuth(authHeader: string): Promise<string> {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const supabase = createSupabaseClient(authHeader);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  return user.id;
}
