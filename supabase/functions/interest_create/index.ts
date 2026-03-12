import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function generateRequestId(): string {
  return crypto.randomUUID()
}

function log(level: 'info' | 'error', requestId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    request_id: requestId,
    message,
    ...data,
  }
  console.log(JSON.stringify(logEntry))
}

// Helper to normalize phone numbers
function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

// Helper to emit webhooks (best-effort)
async function emitWebhook(supabase: any, eventType: string, payload: any, channel: string) {
  try {
    const { error } = await supabase.functions.invoke('webhooks_dispatch', {
      body: { eventType, payload, channel },
    });

    if (error) {
      console.warn('[interest_create] Webhook emit failed:', eventType, error);
    } else {
      console.log('[interest_create] Webhook emitted:', eventType);
    }
  } catch (err) {
    console.warn('[interest_create] Webhook emit error:', eventType, err);
    // Never fail the main flow
  }
}

// Time window for duplicate detection (10 minutes)
const DUPLICATE_WINDOW_MINUTES = 10;

serve(async (req) => {
  const requestId = generateRequestId()
  
  if (req.method === 'OPTIONS') {
    log('info', requestId, 'CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    log('info', requestId, 'Processing interest request')

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      log('error', requestId, 'Failed to parse request body', { error: parseError })
      return new Response(
        JSON.stringify({ ok: false, code: 'invalid_json', message: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { product_id, name, phone, message, source = 'site', page_url } = body

    // Normalize phone if provided
    const normalizedPhone = phone ? normalizePhone(phone) : null;

    log('info', requestId, 'Request received', {
      product_id,
      has_name: !!name,
      has_phone: !!normalizedPhone,
      has_message: !!message,
      source,
      page_url,
      normalizedPhone: normalizedPhone ? normalizedPhone.substring(0, 4) + '***' : null,
    })

    if (!product_id) {
      log('error', requestId, 'Missing required field', { field: 'product_id' })
      return new Response(
        JSON.stringify({ ok: false, code: 'missing_product_id', message: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Validate product
    log('info', requestId, 'Fetching product', { product_id })
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        active,
        product_categories (
          categories (name)
        )
      `)
      .eq('id', product_id)
      .eq('active', true)
      .single()

    if (productError || !product) {
      log('error', requestId, 'Product not found', { product_id })
      return new Response(
        JSON.stringify({ ok: false, code: 'product_not_found', message: 'Product not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('info', requestId, 'Product found', { product_id, product_name: product.name })

    // 2. Deduplicate/Find Lead (using normalized phone)
    let lead = null
    if (normalizedPhone) {
      log('info', requestId, 'Searching for existing lead', { normalizedPhone: normalizedPhone.substring(0, 4) + '***' })
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      lead = existingLead
    }

    // Create Lead if not found
    let newLead = null
    if (!lead) {
      log('info', requestId, 'Creating new lead')
      const { data: newLeadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: name || 'Cliente Interessado',
          phone: normalizedPhone,
          channel: source,
          status: 'new_interest',
          notes: message,
          last_activity_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (leadError) {
        log('error', requestId, 'Failed to create lead', { error: leadError.message })
        return new Response(
          JSON.stringify({ ok: false, code: 'lead_creation_failed', message: 'Failed to create lead' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      newLead = newLeadData
      lead = newLead
      log('info', requestId, 'Lead created', { lead_id: lead.id })

      // Emit lead.created webhook (server-side)
      await emitWebhook(supabase, 'lead.created', {
        lead_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        channel: lead.channel,
        source,
      }, 'site')
    } else {
      log('info', requestId, 'Using existing lead', { lead_id: lead.id })
    }

    // Resolve the lead to use (existing or newly created)
    const resolvedLead = lead ?? newLead
    if (!resolvedLead?.id) {
      log('error', requestId, 'Lead is invalid', { lead, newLead })
      return new Response(
        JSON.stringify({ ok: false, code: 'lead_invalid', message: 'Lead is invalid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Check/Create Opportunity with time-based deduplication
    const { data: existingOpp } = await supabase
      .from('opportunities')
      .select('*')
      .eq('lead_id', resolvedLead.id)
      .eq('product_id', product_id)
      .in('stage', ['talking_ai', 'new_interest'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let opportunity = existingOpp

    if (!opportunity) {
      log('info', requestId, 'Creating new opportunity')
      const { data: newOpp, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          lead_id: resolvedLead.id,
          product_id,
          stage: 'talking_ai',
        })
        .select()
        .single()

      if (oppError) {
        log('error', requestId, 'Failed to create opportunity', { error: oppError.message })
        return new Response(
          JSON.stringify({ ok: false, code: 'opportunity_creation_failed', message: 'Failed to create opportunity' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      opportunity = newOpp
      log('info', requestId, 'Opportunity created', { opportunity_id: opportunity.id })

      // 4. Create Timeline Event
      await supabase.from('lead_timeline').insert({
        lead_id: resolvedLead.id,
        type: 'opportunity_created',
        message: null,
        meta: {
          opportunity_id: opportunity.id,
          product_id: product.id,
          product_name: product.name,
          source,
        },
      })

      // 5. Increment unread count and update activity
      // FIX: Fetch fresh value to avoid race condition
      const { data: freshLead } = await supabase
        .from('leads')
        .select('unread_interest_count')
        .eq('id', resolvedLead.id)
        .single()

      const currentCount = freshLead?.unread_interest_count || 0

      await supabase
        .from('leads')
        .update({
          unread_interest_count: currentCount + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', resolvedLead.id)

      log('info', requestId, 'Timeline and lead stats updated', { unread_interest_count: currentCount + 1 })

      // Emit opportunity.created webhook (server-side)
      await emitWebhook(supabase, 'opportunity.created', {
        opportunity_id: opportunity.id,
        lead_id: resolvedLead.id,
        product_id: product.id,
        product_name: product.name,
        stage: opportunity.stage,
        source,
      }, 'site')
    } else {
      // Existing opportunity found - check time window
      const now = new Date()
      const oppCreatedAt = new Date(opportunity.created_at)
      const diffMinutes = (now.getTime() - oppCreatedAt.getTime()) / (1000 * 60)
      
      if (diffMinutes < DUPLICATE_WINDOW_MINUTES) {
        log('info', requestId, 'Duplicate interest detected (within time window)', {
          opportunity_id: opportunity.id,
          minutes_ago: diffMinutes.toFixed(2),
          window_minutes: DUPLICATE_WINDOW_MINUTES,
        })
        // Use existing opportunity - treat as accidental duplicate
      } else {
        log('info', requestId, 'New legitimate interest after time window', {
          existing_opportunity_id: opportunity.id,
          minutes_ago: diffMinutes.toFixed(2),
          window_minutes: DUPLICATE_WINDOW_MINUTES,
        })
        
        // Create new opportunity for legitimate repeat interest
        const { data: newOpp, error: oppError } = await supabase
          .from('opportunities')
          .insert({
            lead_id: resolvedLead.id,
            product_id,
            stage: 'talking_ai',
          })
          .select()
          .single()

        if (oppError) {
          log('error', requestId, 'Failed to create new opportunity', { error: oppError.message })
          return new Response(
            JSON.stringify({ ok: false, code: 'opportunity_creation_failed', message: 'Failed to create opportunity' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        opportunity = newOpp
        log('info', requestId, 'New opportunity created for repeat interest', { opportunity_id: opportunity.id })

        // Create Timeline Event
        await supabase.from('lead_timeline').insert({
          lead_id: resolvedLead.id,
          type: 'opportunity_created',
          message: null,
          meta: {
            opportunity_id: opportunity.id,
            product_id: product.id,
            product_name: product.name,
            source,
            is_repeat_interest: true,
            previous_opportunity_id: existingOpp.id,
          },
        })

        // Increment unread count and update activity
        const { data: freshLead } = await supabase
          .from('leads')
          .select('unread_interest_count')
          .eq('id', resolvedLead.id)
          .single()

        const currentCount = freshLead?.unread_interest_count || 0

        await supabase
          .from('leads')
          .update({
            unread_interest_count: currentCount + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', resolvedLead.id)

        log('info', requestId, 'Timeline and lead stats updated', { unread_interest_count: currentCount + 1 })

        // Emit opportunity.created webhook
        await emitWebhook(supabase, 'opportunity.created', {
          opportunity_id: opportunity.id,
          lead_id: resolvedLead.id,
          product_id: product.id,
          product_name: product.name,
          stage: opportunity.stage,
          source,
          is_repeat_interest: true,
        }, 'site')
      }
    }

    // 6. Build message for agent
    const categoryNames = product.product_categories
      ?.map((pc: any) => pc.categories?.name)
      .filter(Boolean)
      .join(', ') || ''

    const message_to_agent = 
`Tenho interesse neste móvel: ${product.name}
${categoryNames ? `Categoria: ${categoryNames}` : ''}
Produto ID: ${product.id}
Link: ${page_url || `/product/${product.id}`}
${message ? `Mensagem: ${message}` : ''}

Nome: ${resolvedLead.name}
${normalizedPhone ? `Telefone: ${normalizedPhone}` : ''}`

    // 7. Webhooks (best-effort)
    const webhookPayload = {
      event_type: 'opportunity.created_from_interest',
      lead: resolvedLead,
      opportunity,
      product: { id: product.id, name: product.name },
      message_to_agent,
      context: { source, page_url, timestamp: new Date().toISOString() },
    }

    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .contains('events', ['opportunity.created_from_interest'])
      .eq('active', true)

    if (endpoints && endpoints.length > 0) {
      log('info', requestId, 'Sending webhooks', { count: endpoints.length })
      for (const endpoint of endpoints) {
        let statusCode = 500
        let success = false
        try {
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(endpoint.secret ? { 'X-Webhook-Secret': endpoint.secret } : {}),
            },
            body: JSON.stringify(webhookPayload),
          })
          statusCode = response.status
          success = response.ok
        } catch (error) {
          log('error', requestId, 'Webhook failed', { endpoint_id: endpoint.id, error })
          statusCode = 0
        }
        // Log attempt
        await supabase.from('webhook_logs').insert({
          endpoint_id: endpoint.id,
          event_type: 'opportunity.created_from_interest',
          payload: webhookPayload,
          status_code: statusCode,
          success,
          error: success ? null : 'Failed',
        })
      }
    }

    log('info', requestId, 'Request completed successfully', {
      lead_id: resolvedLead.id,
      opportunity_id: opportunity.id,
      is_duplicate: diffMinutes < DUPLICATE_WINDOW_MINUTES,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        lead_id: resolvedLead.id,
        opportunity_id: opportunity.id,
        message: 'Interesse registrado com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    log('error', requestId, 'Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return new Response(
      JSON.stringify({ ok: false, code: 'internal_error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})