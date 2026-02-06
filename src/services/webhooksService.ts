import { supabase } from '@/core/supabaseClient';

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created',
  OPPORTUNITY_CREATED: 'opportunity.created',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity.stage_changed',
  ORDER_CREATED: 'order.created',
  ORDER_STAGE_CHANGED: 'order.stage_changed',
  WEBHOOK_TEST: 'webhook.test',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
export type WebhookChannel = 'site' | 'crm' | 'pipeline' | 'api';

function buildEnvelope(
  eventType: string,
  data: Record<string, any>,
  channel: WebhookChannel,
  meta?: Record<string, any>
) {
  return {
    version: "1.0",
    event_type: eventType,
    event_id: crypto.randomUUID(),
    occurred_at: new Date().toISOString(),
    source: {
      app: "moveis-nascimento",
      env: import.meta.env.MODE,
      channel,
    },
    data,
    meta: meta ?? {},
  };
}

export const webhooksService = {
  async emit(
    eventType: string,
    data: Record<string, any>,
    channel: WebhookChannel = 'api',
    meta?: Record<string, any>,
    endpointId?: string
  ) {
    try {
      const envelope = buildEnvelope(eventType, data, channel, meta);

      const { data: responseData, error } = await supabase.functions.invoke('webhooks_dispatch', {
        body: { envelope, endpointId },
      });

      if (error) {
        console.warn('[webhooksService.emit] Error invoking webhooks_dispatch:', error);
        return;
      }

      if (!responseData?.ok) {
        console.warn('[webhooksService.emit] webhooks_dispatch returned error:', responseData.error);
        return;
      }

      console.log('[webhooksService.emit] Dispatched', eventType, 'to', responseData.results?.length || 0, 'endpoints', '(channel:', channel + ')');
    } catch (error) {
      console.warn('[webhooksService.emit] Unexpected error:', error);
      // Never fail the main flow - best-effort
    }
  },
};