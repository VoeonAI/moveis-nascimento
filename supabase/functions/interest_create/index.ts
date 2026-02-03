import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper para gerar request_id
function generateRequestId(): string {
  return crypto.randomUUID()
}

// Helper para log estruturado
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

serve(async (req) => {
  const requestId = generateRequestId()
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    log('info', requestId, 'CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    log('info', requestId, 'Processing interest request')

    // Parse request body
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

    // Log input (sem dados sensíveis)
    log('info', requestId, 'Request received', {
      product_id,
      has_name: !!name,
      has_phone: !!phone,
      has_message: !!message,
      source,
      page_url,
    })

    // Validate required fields
    if (!product_id) {
      log('error', requestId, 'Missing required field', { field: 'product_id' })
      return new Response(
        JSON.stringify({ ok: false, code: 'missing_product_id', message: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Validate product exists and is active
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

    if (productError) {
      log('error', requestId, 'Product query failed', { 
        product_id, 
        error: productError.message 
      })
      return new Response(
        JSON.stringify({ ok: false, code: 'product_not_found', message: 'Product not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!product) {
      log('error', requestId, 'Product not found', { product_id })
      return new Response(
        JSON.stringify({ ok: false, code: 'product_not_found', message: 'Product not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('info', requestId, 'Product found', { product_id, product_name: product.name })

    // 2. Deduplicate/Find Lead by phone
    let lead = null
    if (phone) {
      log('info', requestId, 'Searching for existing lead by phone', { phone: phone.replace(/\d(?=\d{4})/g, '*') }) // Mask phone
      
      const { data: existingLead, error: findLeadError } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (findLeadError) {
        log('error', requestId, 'Failed to search lead', { error: findLeadError.message })
        // Continue - will create new lead
      } else {
        lead = existingLead
        if (lead) {
          log('info', requestId, 'Found existing lead', { lead_id: lead.id })
        }
      }
    }

    // Create Lead if not found or no phone provided
    if (!lead) {
      log('info', requestId, 'Creating new lead')
      
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: name || 'Cliente Interessado',
          phone,
          channel: source,
          status: 'new_interest',
          notes: message,
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
      
      lead = newLead
      log('info', requestId, 'Lead created', { lead_id: lead.id })
    }

    // 3. Check for existing open opportunity for this lead+product
    log('info', requestId, 'Checking for existing opportunity', { lead_id: lead.id, product_id })
    
    const { data: existingOpp, error: findOppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('product_id', product_id)
      .in('stage', ['talking_ai', 'new_interest'])
      .maybeSingle()

    if (findOppError) {
      log('error', requestId, 'Failed to check existing opportunity', { error: findOppError.message })
      // Continue - will create new opportunity
    }

    let opportunity = existingOpp

    // Create new opportunity if none exists
    if (!opportunity) {
      log('info', requestId, 'Creating new opportunity')
      
      const { data: newOpp, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          lead_id: lead.id,
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
      }
      
      opportunity = newOpp
      log('info', requestId, 'Opportunity created', { opportunity_id: opportunity.id })
    } else {
      log('info', requestId, 'Using existing opportunity', { opportunity_id: opportunity.id })
    }

    // 4. Build message for agent (NO PRICE)
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

Nome: ${lead.name}
${phone ? `Telefone: ${phone}` : ''}`

    // 5. Prepare webhook payload
    const webhookPayload = {
      event_type: 'opportunity.created_from_interest',
      lead,
      opportunity,
      product: {
        id: product.id,
        name: product.name,
      },
      message_to_agent,
      context: {
        source,
        page_url,
        timestamp: new Date().toISOString(),
      },
    }

    // 6. Find active webhooks for this event
    log('info', requestId, 'Searching for webhooks')
    
    const { data: endpoints, error: endpointsError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .contains('events', ['opportunity.created_from_interest'])
      .eq('active', true)

    if (endpointsError) {
      log('error', requestId, 'Failed to fetch webhooks', { error: endpointsError.message })
      // Continue - webhooks are best-effort
    }

    // 7. Send webhooks and log (best-effort)
    if (endpoints && endpoints.length > 0) {
      log('info', requestId, 'Sending webhooks', { count: endpoints.length })
      
      for (const endpoint of endpoints) {
        let statusCode = 500
        let responseBody = ''
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
          responseBody = await response.text()
          success = response.ok
          
          log('info', requestId, 'Webhook sent', {
            endpoint_id: endpoint.id,
            status_code: statusCode,
            success,
          })
        } catch (error) {
          log('error', requestId, 'Webhook failed', {
            endpoint_id: endpoint.id,
            error: error instanceof Error ? error.message : String(error),
          })
          statusCode = 0
        }

        // Log attempt (best-effort - don't fail if log fails)
        try {
          await supabase
            .from('webhook_logs')
            .insert({
              endpoint_id: endpoint.id,
              event_type: 'opportunity.created_from_interest',
              payload: webhookPayload,
              status_code: statusCode,
              success,
              error: success ? null : responseBody,
            })
        } catch (logError) {
          log('error', requestId, 'Failed to log webhook', { error: logError })
        }
      }
    } else {
      log('info', requestId, 'No webhooks configured')
    }

    log('info', requestId, 'Request completed successfully', {
      lead_id: lead.id,
      opportunity_id: opportunity.id,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        lead_id: lead.id,
        opportunity_id: opportunity.id,
        message: 'Interesse registrado com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    log('error', requestId, 'Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        code: 'internal_error', 
        message: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})