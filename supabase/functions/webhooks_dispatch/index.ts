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
    // Parse request body
    const { eventType, payload, endpointId } = await req.json()

    if (!eventType) {
      return new Response(
        JSON.stringify({ ok: false, error: 'eventType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch endpoints
    let query = supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('active', true)
      .contains('events', [eventType])

    if (endpointId) {
      query = query.eq('id', endpointId)
    }

    const { data: endpoints, error: endpointsError } = await query

    if (endpointsError) {
      console.error('[webhooks_dispatch] Error fetching endpoints:', endpointsError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch endpoints' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!endpoints || endpoints.length === 0) {
      console.log('[webhooks_dispatch] No active endpoints for event:', eventType)
      return new Response(
        JSON.stringify({ ok: true, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Dispatch to each endpoint and log results
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        let statusCode = 0
        let success = false
        let responseBody = null
        let error = null

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          if (endpoint.secret) {
            headers['X-Webhook-Secret'] = endpoint.secret
          }

          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              event: eventType,
              timestamp: new Date().toISOString(),
              payload,
            }),
          })

          statusCode = response.status
          success = response.ok

          // Try to read response body (limit size)
          try {
            const text = await response.text()
            responseBody = text.length > 1000 ? text.slice(0, 1000) + '...' : text
          } catch {
            responseBody = null
          }
        } catch (err: any) {
          error = err?.message || 'Network error'
          console.error(`[webhooks_dispatch] Failed to dispatch to ${endpoint.url}:`, err)
        }

        // Log attempt
        try {
          await supabase.from('webhook_logs').insert({
            endpoint_id: endpoint.id,
            event_type: eventType,
            payload,
            status_code: statusCode,
            success,
            error,
            created_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error('[webhooks_dispatch] Failed to log webhook:', logError)
        }

        return {
          endpoint_id: endpoint.id,
          success,
          status_code: statusCode,
          error,
        }
      })
    )

    return new Response(
      JSON.stringify({
        ok: true,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[webhooks_dispatch] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})