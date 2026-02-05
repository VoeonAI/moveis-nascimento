import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Utility function to build versioned webhook envelope
function buildWebhookEnvelope(eventType: string, data: any, meta?: any) {
  return {
    version: "1.0",
    event_type: eventType,
    event_id: crypto.randomUUID(),
    occurred_at: new Date().toISOString(),
    source: {
      app: "moveis-nascimento",
      env: Deno.env.get('ENVIRONMENT') || 'production',
      channel: 'web',
    },
    data,
    meta,
  };
}

serve(async (req) => {
  // Dynamic CORS headers
  const origin = req.headers.get('origin') ?? '*'
  const reqHeaders = req.headers.get('access-control-request-headers') ?? 'authorization, apikey, content-type, x-client-info'

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders,
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[webhooks_dispatch] CORS preflight request', { origin, reqHeaders })
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    console.log('[webhooks_dispatch] Processing request', {
      method: req.method,
      url: req.url,
    })

    // Parse request body
    let body: any = null
    try {
      body = await req.json()
      console.log('[webhooks_dispatch] Parsed body:', {
        hasEventType: !!body?.eventType,
        hasEndpointId: !!body?.endpointId,
        hasPayload: !!body?.payload,
      })
    } catch (parseError) {
      console.error('[webhooks_dispatch] Failed to parse request body', parseError)
      
      // Log the error
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      try {
        await supabase.from('webhook_logs').insert({
          endpoint_id: null,
          event_type: 'webhook.dispatch_error',
          payload: { rawError: String(parseError), note: 'failed to parse body' },
          status_code: null,
          success: false,
          error: 'invalid_json',
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error('[webhooks_dispatch] Failed to log parse error:', logError)
      }
      
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid_json' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { eventType, payload, endpointId } = body

    if (!eventType) {
      console.error('[webhooks_dispatch] Missing eventType in body')
      return new Response(
        JSON.stringify({ ok: false, error: 'eventType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch endpoints
    let query = supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('active', true)

    if (endpointId) {
      console.log('[webhooks_dispatch] Fetching specific endpoint:', endpointId)
      query = query.eq('id', endpointId)
    } else {
      console.log('[webhooks_dispatch] Fetching endpoints for event:', eventType)
      query = query.contains('events', [eventType])
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
      
      // Log that no endpoints were found
      try {
        await supabase.from('webhook_logs').insert({
          endpoint_id: null,
          event_type: eventType,
          payload: { note: 'no_endpoints' },
          status_code: null,
          success: false,
          error: 'no_endpoints',
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error('[webhooks_dispatch] Failed to log no endpoints:', logError)
      }
      
      return new Response(
        JSON.stringify({ ok: true, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[webhooks_dispatch] Found', endpoints.length, 'endpoints to dispatch')

    // Dispatch to each endpoint with timeout
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        let statusCode: number | null = null
        let success = false
        let error: string | null = null
        let responsePreview: string | null = null

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        // Build versioned envelope
        const envelope = buildWebhookEnvelope(eventType, payload, {
          endpoint_id: endpoint.id,
          endpoint_name: endpoint.name,
        })

        try {
          console.log('[webhooks_dispatch] Fetching endpoint:', {
            id: endpoint.id,
            name: endpoint.name,
            url: endpoint.url,
            event_id: envelope.event_id,
          })

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          if (endpoint.secret) {
            headers['X-Webhook-Secret'] = endpoint.secret
          }

          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify(envelope),
          })

          clearTimeout(timeoutId)
          statusCode = response.status
          success = response.ok

          // Try to read response body (limit size)
          try {
            const text = await response.text()
            responsePreview = text.length > 500 ? text.slice(0, 500) + '...' : text
          } catch {
            responsePreview = null
          }

          console.log('[webhooks_dispatch] Fetch completed:', {
            endpointId: endpoint.id,
            event_id: envelope.event_id,
            status: statusCode,
            success,
          })
        } catch (err: any) {
          clearTimeout(timeoutId)
          error = err?.message || 'Network error'
          if (err.name === 'AbortError') {
            error = 'Timeout (10s)'
          }
          console.error(`[webhooks_dispatch] Failed to dispatch to ${endpoint.url}:`, error)
        }

        // Log attempt with envelope
        try {
          await supabase.from('webhook_logs').insert({
            endpoint_id: endpoint.id,
            event_type: eventType,
            payload: {
              envelope,
              sentAt: new Date().toISOString(),
              request: {
                endpoint: endpoint.name,
                url: endpoint.url,
              },
              response: {
                status: statusCode,
                preview: responsePreview,
              },
            },
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
          event_id: envelope.event_id,
          success,
          status_code: statusCode,
          error,
        }
      })
    )

    console.log('[webhooks_dispatch] All dispatches completed')

    return new Response(
      JSON.stringify({
        ok: true,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[webhooks_dispatch] Unexpected error:', error)
    
    // Try to log unexpected error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase.from('webhook_logs').insert({
        endpoint_id: null,
        event_type: 'webhook.dispatch_error',
        payload: { error: String(error) },
        status_code: null,
        success: false,
        error: 'unexpected_error',
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error('[webhooks_dispatch] Failed to log unexpected error:', logError)
    }
    
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})