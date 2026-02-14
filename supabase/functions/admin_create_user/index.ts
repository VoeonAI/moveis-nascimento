import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-version',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // 1. Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. Create Supabase client with Service Role Key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check if caller is master
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerProfile.role !== 'master') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden: Only master users can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Parse request body
    const { email, password, role, must_change_password } = await req.json()

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields: email, password, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    const validRoles = ['master', 'gestor', 'estoque']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-creation (edge case check)
    // Note: We don't have the new user ID yet, so we can't strictly check if it's the same user.
    // But we can check if the email matches the caller's email if we fetch it.
    // For now, we skip this as the caller is creating a NEW user.

    // 6. Create Auth User
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email to avoid invite flow
      user_metadata: {
        created_by: user.id,
      }
    })

    if (createError) {
      console.error('[admin_create_user] Auth creation error:', createError.message)
      return new Response(
        JSON.stringify({ ok: false, error: createError.message || 'Failed to create auth user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create auth user: No user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Update Profile (trigger 'handle_new_user' should have created it, but we update specific fields)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role,
        must_change_password: must_change_password ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('[admin_create_user] Profile update error:', updateError.message)
      // Don't fail completely if profile update fails, log it but return success for auth creation
      // Or return error? Let's return error to ensure consistency.
      return new Response(
        JSON.stringify({ ok: false, error: 'Auth user created but failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Return success
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'User created successfully',
        user_id: authData.user.id,
        email: authData.user.email,
        role,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[admin_create_user] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})