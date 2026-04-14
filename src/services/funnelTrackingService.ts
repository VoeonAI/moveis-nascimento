import { supabase } from '@/core/supabaseClient';

/**
 * Tracking simplificado do funil de conversão
 * 
 * Eventos disponíveis:
 * - "interest_click": Usuário clicou em botão de interesse (abertura do modal)
 * - "message_sent": Mensagem enviada via webhook (lead gerado)
 */

/**
 * Registra um evento do funil de forma não-bloqueante
 * @param eventType Tipo do evento a ser registrado
 */
export async function trackEvent(eventType: 'interest_click' | 'message_sent'): Promise<void> {
  try {
    console.log('[FunnelTracking] Tracking event:', eventType);

    // Inserção não-bloqueante (não aguarda resultado)
    supabase
      .from('funnel_events')
      .insert({ event_type: eventType })
      .then(({ error }) => {
        if (error) {
          console.error('[FunnelTracking] Error tracking event:', error);
        } else {
          console.log('[FunnelTracking] Event tracked successfully:', eventType);
        }
      });
  } catch (error) {
    // Try/catch silencioso - não afeta UX
    console.error('[FunnelTracking] Unexpected error:', error);
  }
}

/**
 * Busca contagem de eventos por tipo
 */
export async function getEventsCountByType(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('funnel_events')
      .select('event_type');

    if (error) {
      console.error('[FunnelTracking] Error fetching events:', error);
      return {};
    }

    // Contar eventos por tipo
    const counts: Record<string, number> = {};
    data?.forEach((event) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('[FunnelTracking] Error in getEventsCountByType:', error);
    return {};
  }
}

/**
 * Busca contagem de eventos por período (últimos N dias)
 */
export async function getEventsByPeriod(days: number = 7): Promise<Record<string, number>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('funnel_events')
      .select('event_type')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('[FunnelTracking] Error fetching events by period:', error);
      return {};
    }

    // Contar eventos por tipo no período
    const counts: Record<string, number> = {};
    data?.forEach((event) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('[FunnelTracking] Error in getEventsByPeriod:', error);
    return {};
  }
}

/**
 * Calcula taxa de conversão básica do funil
 * @returns Taxa de conversão (message_sent / interest_click)
 */
export async function getConversionRate(): Promise<number> {
  try {
    const counts = await getEventsCountByType();
    const interestClicks = counts['interest_click'] || 0;
    const messageSent = counts['message_sent'] || 0;

    if (interestClicks === 0) return 0;

    const rate = (messageSent / interestClicks) * 100;
    return Math.round(rate * 100) / 100; // 2 casas decimais
  } catch (error) {
    console.error('[FunnelTracking] Error in getConversionRate:', error);
    return 0;
  }
}
