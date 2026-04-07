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
    const { customer_name, customer_phone, message, source, context } = body

    console.log('[agent_create_lead_interest] Request received:', {
      customer_name,
      customer_phone,
      message,
      source,
      context,
    })

    // Validate required fields
    if (!customer_phone) {
      console.log('[agent_create_lead_interest] Validation failed: missing customer_phone')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: customer_phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!message) {
      console.log('[agent_create_lead_interest] Validation failed: missing message')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: message' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone (remove all non-numeric characters)
    const normalizedPhone = customer_phone.replace(/\D/g, '')
    console.log('[agent_create_lead_interest] Normalized phone:', normalizedPhone)

    // Try to find existing lead by phone
    const { data: existingLead, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', normalizedPhone)
      .is('archived', false)
      .single()

    if (findError) {
      console.log('[agent_create_lead_interest] Lead not found, will create new')
    } else {
      console.log('[agent_create_lead_interest] Found existing lead:', existingLead.id)
    }

    let lead
    let created = false

    if (findError || !existingLead) {
      // Lead doesn't exist, create new one
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          name: customer_name || 'Cliente (sem nome)',
          phone: normalizedPhone,
          channel: source === 'n8n' ? 'ai_assistant' : 'site',
          status: 'new_interest',
          last_activity_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error('[agent_create_lead_interest] Create lead error:', createError)
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to create lead' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      lead = newLead
      created = true
      console.log('[agent_create_lead_interest] New lead created:', lead.id)
    } else {
      // Lead exists, reuse it
      lead = existingLead
      created = false
      console.log('[agent_create_lead_interest] Reusing existing lead:', lead.id)

      // Update last_activity_at
      await supabase
        .from('leads')
        .update({
          last_activity_at: new Date().toISOString(),
          // Update name if provided and current name is generic
          ...(customer_name && lead.name.includes('(sem nome)') ? { name: customer_name } : {}),
        })
        .eq('id', lead.id)
      console.log('[agent_create_lead_interest] Lead updated:', lead.id)
    }

    // Build timeline message
    const timelineMessage = customer_name
      ? `${customer_name} expressou interesse via ${source === 'n8n' ? 'Assistente IA' : 'Site AI'}: ${message}`
      : `Cliente expressou interesse via ${source === 'n8n' ? 'Assistente IA' : 'Site AI'}: ${message}`

    console.log('[agent_create_lead_interest] Timeline message:', timelineMessage)

    // Insert timeline entry
    let timelineCreated = false
    try {
      const { error: timelineError } = await supabase
        .from('lead_timeline')
        .insert({
          lead_id: lead.id,
          type: 'note',
          message: timelineMessage,
          meta: {
            source,
            context: context || {},
            intent: context?.intent || 'catalog_interest',
            product_id: context?.product_id,
            product_name: context?.product_name,
            category_slug: context?.category_slug,
            agent_id: tokenData.id,
            agent_name: tokenData.name,
          },
          created_by: null, // System-generated
        })

      if (!timelineError) {
        timelineCreated = true
        console.log('[agent_create_lead_interest] Timeline entry created successfully')
      } else {
        console.error('[agent_create_lead_interest] Timeline insert error:', timelineError)
      }
    } catch (timelineError) {
      console.error('[agent_create_lead_interest] Timeline error (non-critical):', timelineError)
    }

    const response = {
      ok: true,
      message: created ? 'Lead created successfully' : 'Lead found and updated',
      lead_id: lead.id,
      created,
      timeline_created: timelineCreated,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        channel: lead.channel,
        status: lead.status,
      },
    }

    console.log('[agent_create_lead_interest] Response:', response)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_create_lead_interest] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})