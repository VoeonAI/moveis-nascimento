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

/**
 * Normalize phone number to E.164 format (Brazil)
 * Removes all non-numeric characters and adds country code if needed
 */
function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If starts with 55 (Brazil country code), keep it
  // If starts with 0 (like 011), remove the 0 and add 55
  // Otherwise, add 55 prefix
  if (!cleaned.startsWith('55')) {
    if (cleaned.startsWith('0')) {
      cleaned = '55' + cleaned.substring(1)
    } else {
      cleaned = '55' + cleaned
    }
  }
  
  return cleaned
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

    // Check if token has orders:read scope
    if (!tokenData.scopes.includes('orders:read')) {
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

    // Get phone from query params
    const url = new URL(req.url)
    const phone = url.searchParams.get('phone')

    if (!phone) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required parameter: phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone)

    // Calculate 90 days ago
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Fetch orders from the last 90 days
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_phone, current_stage, created_at, updated_at')
      .eq('customer_phone', normalizedPhone)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('[agent_find_recent_orders_by_phone] Query error:', ordersError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch orders' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform response
    const transformedOrders = (orders || []).map(order => {
      const stageLabel = ORDER_STAGE_LABELS[order.current_stage] || order.current_stage
      
      return {
        order_id: order.id,
        product_name: stageLabel, // Using stage label as product name for now
        created_at: order.created_at,
        order_stage: order.current_stage,
        updated_at: order.updated_at,
      }
    })

    return new Response(
      JSON.stringify({
        ok: true,
        orders: transformedOrders,
        count: transformedOrders.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_find_recent_orders_by_phone] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
