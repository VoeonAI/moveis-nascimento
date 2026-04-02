import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-agent-token, content-type',
}

// Order stage mappings
const ORDER_STAGE_LABELS: Record<string, string> = {
  'order_created': 'Pedido Criado',
  'preparing_order': 'Preparando Pedido',
  'assembly': 'Em Montagem',
  'ready_to_ship': 'Pronto para Envio',
  'delivery_route': 'Em Rota de Entrega',
  'delivered': 'Entregue',
  'canceled': 'Cancelado',
}

// Opportunity stage mappings
const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  'new_interest': 'Novo Interesse',
  'talking_ai': 'Falando com IA',
  'talking_human': 'Falando com Humano',
  'proposal_sent': 'Proposta Enviada',
  'won': 'Ganho',
  'lost': 'Perdido',
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

    // Check if token has leads:read scope (using as general read permission)
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

    // Get order_id from query params
    const url = new URL(req.url)
    const orderId = url.searchParams.get('order_id')

    if (!orderId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required parameter: order_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Order not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch opportunity if exists
    let opportunity = null
    if (order.opportunity_id) {
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('*, products(name)')
        .eq('id', order.opportunity_id)
        .maybeSingle()
      opportunity = oppData
    }

    // Fetch lead if exists
    let lead = null
    if (order.lead_id) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('id, name, phone')
        .eq('id', order.lead_id)
        .maybeSingle()
      lead = leadData
    }

    // Build friendly status
    const currentStage = order.current_stage
    const friendlyStatus = ORDER_STAGE_LABELS[currentStage] || currentStage

    // Build response
    const response = {
      ok: true,
      order: {
        id: order.id,
        status: {
          technical: currentStage,
          friendly: friendlyStatus,
        },
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      customer: lead ? {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
      } : null,
      opportunity: opportunity ? {
        id: opportunity.id,
        stage: {
          technical: opportunity.stage,
          friendly: OPPORTUNITY_STAGE_LABELS[opportunity.stage] || opportunity.stage,
        },
        product: opportunity.products ? {
          name: opportunity.products.name,
        } : null,
      } : null,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_get_order_status] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
