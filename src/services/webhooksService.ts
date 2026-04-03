import { supabase } from '@/core/supabaseClient';

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created',
  OPPORTUNITY_CREATED: 'opportunity.created',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity.stage_changed',
  ORDER_CREATED: 'order.created',
  ORDER_STAGE_CHANGED: 'order.stage_changed',
  HOME_AMBIENCE_CLICK: 'home_ambience_click',
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
    console.log('════════════════════════════════════════════════════════════════');
    console.log('[webhooksService.emit] 🔥 INICIANDO EMISSÃO DE WEBHOOK');
    console.log('  - event_type:', eventType);
    console.log('  - channel:', channel);
    console.log('  - endpointId:', endpointId);
    console.log('  - data:', JSON.stringify(data, null, 2));
    console.log('  - meta:', JSON.stringify(meta, null, 2));
    console.log('════════════════════════════════════════════════════════════════');

    try {
      const envelope = buildEnvelope(eventType, data, channel, meta);
      
      console.log('📦 ENVELOPE CRIADO:');
      console.log('  - version:', envelope.version);
      console.log('  - event_type:', envelope.event_type);
      console.log('  - event_id:', envelope.event_id);
      console.log('  - occurred_at:', envelope.occurred_at);
      console.log('  - source:', envelope.source);
      console.log('  - payload completo:', JSON.stringify(envelope, null, 2));
      console.log('════════════════════════════════════════════════════════════════');

      console.log('🚀 INVOCANDO SUPABASE FUNCTION: webhooks_dispatch');
      console.log('  - URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhooks_dispatch`);
      
      const { data: responseData, error } = await supabase.functions.invoke('webhooks_dispatch', {
        body: { envelope, endpointId },
      });

      console.log('════════════════════════════════════════════════════════════════');
      console.log('📬 RESPOSTA DO SUPABASE:');
      console.log('  - error:', error);
      console.log('  - responseData:', JSON.stringify(responseData, null, 2));
      console.log('════════════════════════════════════════════════════════════════');

      if (error) {
        console.error('❌ ERRO AO INVOCAÇÃO DA EDGE FUNCTION:');
        console.error('  - error:', error);
        console.error('  - message:', error.message);
        console.error('  - status:', error.status);
        return;
      }

      if (!responseData?.ok) {
        console.error('❌ ERRO RETORNADO PELA EDGE FUNCTION:');
        console.error('  - ok:', responseData?.ok);
        console.error('  - error:', responseData?.error);
        console.error('  - results:', responseData?.results);
        return;
      }

      console.log('✅ WEBHOOK ENVIADO COM SUCESSO!');
      console.log('  - event_type:', eventType);
      console.log('  - endpoints encontrados:', responseData.results?.length || 0);
      console.log('  - channel:', channel);
      
      if (responseData.results && responseData.results.length > 0) {
        console.log('  - resultados:', JSON.stringify(responseData.results, null, 2));
      }
      console.log('════════════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('════════════════════════════════════════════════════════════════');
      console.error('⚠️ ERRO INESPERADO NO CATCH DO webhooksService.emit:');
      console.error('  - error:', error);
      console.error('  - message:', (error as any)?.message);
      console.error('  - stack:', (error as any)?.stack);
      console.error('════════════════════════════════════════════════════════════════');
      // Never fail the main flow - best-effort
    }
  },
};