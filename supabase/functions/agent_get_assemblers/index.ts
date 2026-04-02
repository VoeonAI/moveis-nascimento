import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-agent-token, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get agent token from header
    const agentToken = req.headers.get('x-agent-token')
    
    if (!agentToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing x-agent-token header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate token and check scopes
    const { data: tokenData, error: tokenError } = await supabase
      .from('agent_tokens')
      .select('*')
      .eq('token_hash', agentToken)
      .eq('active', true)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or inactive token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token has any read scope
    const hasReadScope = tokenData.scopes.includes('leads:read') || 
                        tokenData.scopes.includes('products:read')

    if (!hasReadScope) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient permissions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last_used_at
    await supabase
      .from('agent_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // Parse query params
    const url = new URL(req.url)
    const city = url.searchParams.get('city') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

    // Build query
    let query = supabase
      .from('installers')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(limit)

    // Filter by city if provided
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    const { data: installers, error } = await query

    if (error) {
      console.error('[agent_get_assemblers] Query error:', error)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch assemblers' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform response
    const transformedInstallers = (installers || []).map(installer => ({
      id: installer.id,
      name: installer.name,
      phone: installer.phone,
      city: installer.city || null,
      bio: installer.bio || null,
      photo_url: installer.photo_url || null,
    }))

    return new Response(
      JSON.stringify({
        ok: true,
        assemblers: transformedInstallers,
        count: transformedInstallers.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_get_assemblers] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
