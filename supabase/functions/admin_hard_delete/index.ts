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
    // 1. Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. Create Supabase client with Service Role Key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check if caller is master
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerProfile.role !== 'master') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden: Only master users can perform hard delete' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Parse request body
    const { type, id } = await req.json()

    if (!type || !id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields: type, id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'lead') {
      // --- HARD DELETE LEAD ---
      
      // 1. Find opportunities linked to this lead
      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('lead_id', id)

      if (oppsError) {
        console.error('[admin_hard_delete] Error fetching opportunities:', oppsError)
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to fetch opportunities' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const oppIds = (opportunities || []).map(o => o.id)

      // 2. Find orders linked to these opportunities
      let orderIds: string[] = []
      if (oppIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .in('opportunity_id', oppIds)

        if (ordersError) {
          console.error('[admin_hard_delete] Error fetching orders:', ordersError)
          // Continue anyway, maybe no orders
        } else {
          orderIds = (orders || []).map(o => o.id)
        }
      }

      // 3. Delete order_events
      if (orderIds.length > 0) {
        const { error: eventsError } = await supabase
          .from('order_events')
          .delete()
          .in('order_id', orderIds)
        
        if (eventsError) {
          console.error('[admin_hard_delete] Error deleting order_events:', eventsError)
          // Non-critical, continue
        }
      }

      // 4. Delete orders
      if (orderIds.length > 0) {
        const { error: ordersDeleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds)
        
        if (ordersDeleteError) {
          console.error('[admin_hard_delete] Error deleting orders:', ordersDeleteError)
          // Non-critical, continue
        }
      }

      // 5. Delete opportunities
      if (oppIds.length > 0) {
        const { error: oppsDeleteError } = await supabase
          .from('opportunities')
          .delete()
          .in('id', oppIds)
        
        if (oppsDeleteError) {
          console.error('[admin_hard_delete] Error deleting opportunities:', oppsDeleteError)
          // Non-critical, continue
        }
      }

      // 6. Delete lead_timeline
      const { error: timelineError } = await supabase
        .from('lead_timeline')
        .delete()
        .eq('lead_id', id)
      
      if (timelineError) {
        console.error('[admin_hard_delete] Error deleting lead_timeline:', timelineError)
        // Non-critical, continue
      }

      // 7. Delete lead
      const { error: leadDeleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (leadDeleteError) {
        console.error('[admin_hard_delete] Error deleting lead:', leadDeleteError)
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to delete lead' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: 'Lead e dados relacionados excluídos com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (type === 'order') {
      // --- HARD DELETE ORDER ---

      // 1. Delete order_events
      const { error: eventsError } = await supabase
        .from('order_events')
        .delete()
        .eq('order_id', id)

      if (eventsError) {
        console.error('[admin_hard_delete] Error deleting order_events:', eventsError)
        // Non-critical, continue
      }

      // 2. Delete order
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (orderDeleteError) {
        console.error('[admin_hard_delete] Error deleting order:', orderDeleteError)
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to delete order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: 'Pedido e eventos excluídos com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid type. Must be "lead" or "order"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('[admin_hard_delete] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})