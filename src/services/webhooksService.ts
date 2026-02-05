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

export const webhooksService = {
  async emit(eventType: string, payload: Record<string, any>, channel: WebhookChannel = 'api', endpointId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('webhooks_dispatch', {
        body: { eventType, payload, channel, endpointId },
      });

      if (error) {
        console.warn('[webhooksService.emit] Error invoking webhooks_dispatch:', error);
        return;
      }

      if (!data?.ok) {
        console.warn('[webhooksService.emit] webhooks_dispatch returned error:', data.error);
        return;
      }

      console.log('[webhooksService.emit] Dispatched', eventType, 'to', data.results?.length || 0, 'endpoints', '(channel:', channel + ')');
    } catch (error) {
      console.warn('[webhooksService.emit] Unexpected error:', error);
      // Never fail the main flow - best-effort
    }
  },
};