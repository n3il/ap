import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Privy's JWKS URL for key verification
const JWKS_URL = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No Auth Header')
    const token = authHeader.replace('Bearer ', '')

    // 1. Verify the Privy JWT using Privy's Public Keys (JWKS)
    const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URL))
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    })

    const privyUserId = payload.sub as string
    const email = (payload.email as string) || `${privyUserId}@privy.local`

    // 2. Initialize Supabase Admin Client (to bypass RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 3. Check if auth user exists with this email/privy_user_id
    let authUserId: string | null = null

    // First, check if there's already a profile with this privy_user_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('privy_user_id', privyUserId)
      .single()

    if (existingProfile) {
      authUserId = existingProfile.id
    } else {
      // Create or get auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          privy_user_id: privyUserId,
        }
      })

      if (authError && !authError.message.includes('already registered')) {
        throw authError
      }

      authUserId = authData?.user?.id || null

      // If user already exists, try to find them by email
      if (!authUserId) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)
        if (existingUser) {
          authUserId = existingUser.id
        }
      }
    }

    if (!authUserId) {
      throw new Error('Failed to create or find auth user')
    }

    // 4. Upsert the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: authUserId,
          privy_user_id: privyUserId,
          email: email !== `${privyUserId}@privy.local` ? email : null,
          auth_provider: 'privy',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) throw profileError

    // 5. Create a session for this user using admin API
    // We'll create a temporary password-based session
    const tempPassword = crypto.randomUUID()

    // Update user with temporary password
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: tempPassword
    })

    // Create a new supabase client to sign in as this user
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sessionData, error: sessionError } = await userClient.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (sessionError) throw sessionError

    return new Response(JSON.stringify({
      user: profile,
      session: sessionData.session,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error('Privy auth error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 401 })
  }
})
