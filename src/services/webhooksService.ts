import { supabase } from '@/core/supabaseClient';
import { WebhookLog } from '@/types';

export const webhooksService = {
  async emit(eventType: string, payload: Record<string, any>) {
    // 1. Find active endpoints for this event type
    const { data: endpoints, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching webhook endpoints:', fetchError);
      return;
    }

    if (!endpoints || endpoints.length === 0) return;

    // 2. Fire and forget for each endpoint (log result)
    for (const endpoint of endpoints) {
      this.sendAndLog(endpoint, payload);
    }
  },

  async sendAndLog(endpoint: any, payload: Record<string, any>) {
    let statusCode = 500;
    let responseBody = '';

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      statusCode = response.status;
      responseBody = await response.text();
    } catch (error) {
      console.error(`Webhook failed for ${endpoint.url}:`, error);
      statusCode = 0; // Network error
    }

    // 3. Log attempt
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        endpoint_id: endpoint.id,
        payload,
        status_code: statusCode,
        response_body: responseBody,
        attempted_at: new Date().toISOString(),
      });

    if (logError) console.error('Error logging webhook:', logError);
  },
};