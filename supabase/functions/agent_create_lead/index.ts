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

    // Check if token has leads:write scope
    if (!tokenData.scopes.includes('leads:write')) {
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

    // Parse request body
    const body = await req.json()
    const { name, phone, channel, status, notes } = body

    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: name' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create lead
    const { data: lead, error: createError } = await supabase
      .from('leads')
      .insert({
        name,
        phone,
        channel: channel || 'site',
        status: status || 'new_interest',
        notes,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[agent_create_lead] Create error:', createError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create lead' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add initial timeline event
    try {
      await supabase.from('lead_timeline').insert({
        lead_id: lead.id,
        type: 'note',
        message: `Lead criado via IA (${tokenData.name})`,
        meta: {
          created_by: 'agent',
          channel: lead.channel,
          initial_status: lead.status,
        },
        created_by: null,
      })
    } catch (timelineError) {
      console.error('[agent_create_lead] Timeline error (non-critical):', timelineError)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Lead created successfully',
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          channel: lead.channel,
          status: lead.status,
          created_at: lead.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_create_lead] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
