import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { product_id, name, phone, message, source = 'site', page_url } = await req.json()

    // Validate required fields
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Validate product exists and is active
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
      return new Response(
        JSON.stringify({ error: 'Product not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Deduplicate/Find Lead by phone
    let lead = null
    if (phone) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      lead = existingLead
    }

    // Create Lead if not found or no phone provided
    if (!lead) {
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
        console.error('[interest_create] Error creating lead:', leadError)
        return new Response(
          JSON.stringify({ error: 'Failed to create lead' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      lead = newLead
    }

    // 3. Check for existing open opportunity for this lead+product
    const { data: existingOpp } = await supabase
      .from('opportunities')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('product_id', product_id)
      .in('stage', ['talking_ai', 'new_interest'])
      .maybeSingle()

    let opportunity = existingOpp

    // Create new opportunity if none exists
    if (!opportunity) {
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
        console.error('[interest_create] Error creating opportunity:', oppError)
        return new Response(
          JSON.stringify({ error: 'Failed to create opportunity' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      opportunity = newOpp
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
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .contains('events', ['opportunity.created_from_interest'])
      .eq('active', true)

    // 7. Send webhooks and log
    if (endpoints && endpoints.length > 0) {
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
        } catch (error) {
          console.error(`[interest_create] Webhook failed for ${endpoint.url}:`, error)
          statusCode = 0
        }

        // Log attempt
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
      }
    }

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
    console.error('[interest_create] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})