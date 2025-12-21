import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, privy-app-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No Auth Header')
    const token = authHeader.replace('Bearer ', '')

    // 1. Verify the Privy token by getting user info from Privy
    const userInfoResponse = await fetch('https://auth.privy.io/api/v1/users/me', {
      headers: {
        'privy-app-id': PRIVY_APP_ID,
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      throw new Error(`Invalid Privy token (${userInfoResponse.status}): ${errorText}`)
    }

    const userData = await userInfoResponse.json()
    console.log('Privy user data:', JSON.stringify(userData))

    const privyUserId = userData.id || userData.did
    if (!privyUserId) {
      throw new Error('No user ID found in Privy response')
    }

    // Extract email or other identifier from Privy user data
    let email = `${privyUserId}@privy.local`
    let phone: string | null = null

    // Look through linked accounts for identifiers
    if (userData.linked_accounts && Array.isArray(userData.linked_accounts)) {
      // Priority: Email > Phone > Wallet > Others
      const emailAccount = userData.linked_accounts.find((a: any) =>
        (a.type === 'email' || a.type === 'google_oauth' || a.type === 'apple_oauth') && a.address || a.email
      )
      const phoneAccount = userData.linked_accounts.find((a: any) => a.type === 'phone' && a.number)
      const walletAccount = userData.linked_accounts.find((a: any) => a.type === 'wallet' && a.address)

      if (emailAccount) {
        email = emailAccount.address || emailAccount.email
      } else if (phoneAccount) {
        phone = phoneAccount.number
        email = `${phone?.replace('+', '') || 'unknown'}@phone.privy.local`
      } else if (walletAccount) {
        email = `${walletAccount.address}@wallet.privy.local`
      }
    } else {
      // Fallback to top-level fields if linked_accounts is missing
      if (userData.email?.address) {
        email = userData.email.address
      } else if (userData.phone?.number) {
        phone = userData.phone.number
        email = `${phone?.replace('+', '') || 'unknown'}@phone.privy.local`
      } else if (userData.wallet?.address) {
        email = `${userData.wallet.address}@wallet.privy.local`
      }
    }

    console.log(`Extracted identity: email=${email}, phone=${phone}, privyUserId=${privyUserId}`)

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

    // Create a new supabase client (using anon key) to sign in as this user
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: sessionData, error: sessionError } = await userClient.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    if (!sessionData.session) {
      throw new Error('No session returned from sign in')
    }

    return new Response(JSON.stringify({
      user: profile,
      session: sessionData.session,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error('Privy auth error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    })
  }
})
