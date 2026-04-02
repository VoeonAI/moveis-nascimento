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
    const { lead_id, message } = body

    if (!lead_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: lead_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!message || message.trim() === '') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: message' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if lead exists
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .single()

    if (leadError || !existingLead) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Lead not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add timeline event
    const { data: timelineEvent, error: timelineError } = await supabase
      .from('lead_timeline')
      .insert({
        lead_id,
        type: 'note',
        message,
        meta: {
          created_by: 'agent',
          token_name: tokenData.name,
        },
        created_by: null,
      })
      .select()
      .single()

    if (timelineError) {
      console.error('[agent_add_lead_note] Timeline error:', timelineError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to add lead note' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update lead last_activity_at
    try {
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', lead_id)
    } catch (updateError) {
      console.error('[agent_add_lead_note] Update activity error (non-critical):', updateError)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Lead note added successfully',
        lead_id,
        note: {
          id: timelineEvent.id,
          message: timelineEvent.message,
          created_at: timelineEvent.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_add_lead_note] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
