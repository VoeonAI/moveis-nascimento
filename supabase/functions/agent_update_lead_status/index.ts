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

    // Check if token has leads:update scope
    if (!tokenData.scopes.includes('leads:update')) {
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
    const { lead_id, status } = body

    if (!lead_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: lead_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!status) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: status' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if lead exists
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', lead_id)
      .single()

    if (leadError || !existingLead) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Lead not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const oldStatus = existingLead.status

    // Update lead status
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        status,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', lead_id)

    if (updateError) {
      console.error('[agent_update_lead_status] Update error:', updateError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update lead status' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add timeline event if status changed
    if (oldStatus !== status) {
      try {
        await supabase.from('lead_timeline').insert({
          lead_id,
          type: 'note',
          message: `Status alterado de ${oldStatus} para ${status}`,
          meta: {
            from_status: oldStatus,
            to_status: status,
            updated_by: 'agent',
          },
          created_by: null,
        })
      } catch (timelineError) {
        console.error('[agent_update_lead_status] Timeline error (non-critical):', timelineError)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Lead status updated successfully',
        lead_id,
        old_status: oldStatus,
        new_status: status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_update_lead_status] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
