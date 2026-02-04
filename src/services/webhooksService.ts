import { supabase } from '@/core/supabaseClient';

export const webhooksService = {
  async emit(eventType: string, payload: Record<string, any>, endpointId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('webhooks_dispatch', {
        body: { eventType, payload, endpointId },
      });

      if (error) {
        console.error('[webhooksService.emit] Error invoking webhooks_dispatch:', error);
        return;
      }

      if (!data?.ok) {
        console.error('[webhooksService.emit] webhooks_dispatch returned error:', data.error);
        return;
      }

      console.log('[webhooksService.emit] Dispatched to', data.results?.length || 0, 'endpoints');
    } catch (error) {
      console.error('[webhooksService.emit] Unexpected error:', error);
      // Never fail the main flow
    }
  },
};