import { supabase } from '@/core/supabaseClient';

export const webhooksService = {
  async emit(eventType: string, payload: Record<string, any>) {
    try {
      // 1. Find active endpoints subscribed to this event type
      const { data: endpoints, error: fetchError } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('active', true)
        .contains('events', [eventType]);

      if (fetchError) {
        console.error('[webhooksService.emit] Error fetching endpoints:', fetchError);
        return;
      }

      if (!endpoints || endpoints.length === 0) {
        console.log('[webhooksService.emit] No active endpoints for event:', eventType);
        return;
      }

      // 2. Send webhook to each endpoint (fire and forget, best-effort)
      const promises = endpoints.map((endpoint) => 
        this.sendAndLog(endpoint, eventType, payload)
      );

      // Wait for all webhooks to complete (or fail) but don't block main flow
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('[webhooksService.emit] Unexpected error:', error);
      // Never fail the main flow
    }
  },

  async sendAndLog(
    endpoint: any, 
    eventType: string, 
    payload: Record<string, any>
  ) {
    let statusCode = 500;
    let success = false;
    let error = null;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add secret header if configured
      if (endpoint.secret) {
        headers['X-Webhook-Secret'] = endpoint.secret;
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      statusCode = response.status;
      success = response.ok;
    } catch (err: any) {
      console.error(`[webhooksService.sendAndLog] Webhook failed for ${endpoint.url}:`, err);
      statusCode = 0; // Network error
      success = false;
      error = err?.message || 'Network error';
    }

    // Log attempt (best-effort)
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          endpoint_id: endpoint.id,
          event_type: eventType,
          payload,
          status_code: statusCode,
          success,
          error,
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('[webhooksService.sendAndLog] Failed to log webhook:', logError);
    }
  },
};