import { supabase } from '@/core/supabaseClient';

/**
 * Tracking do funil de conversão usando opportunities como fonte de dados
 * 
 * Estágios do Funil:
 * 1. interest_click: Usuário clicou em botão de interesse (abertura do modal)
 *    Fonte: funnel_events
 * 
 * 2. message_sent: Mensagem enviada (lead criado)
 *    Fonte: opportunities (COUNT(*))
 * 
 * 3. talking_ai: Conversando com IA
 *    Fonte: opportunities WHERE stage = 'talking_ai'
 * 
 * 4. talking_human: Conversando com humano
 *    Fonte: opportunities WHERE stage = 'talking_human'
 * 
 * 5. won: Ganho (venda realizada)
 *    Fonte: opportunities WHERE stage = 'won'
 */

export interface FunnelMetrics {
  interestClicks: number;
  messageSent: number;
  talkingAi: number;
  talkingHuman: number;
  won: number;
  lost: number;
  totalOpportunities: number;
}

/**
 * Registra um evento de clique de interesse
 * @param eventType Tipo do evento (apenas 'interest_click' para funil)
 */
export async function trackEvent(eventType: 'interest_click' | 'message_sent'): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('[FunnelTracking] trackEvent called');
    console.log('[FunnelTracking] Event type:', eventType);
    console.log('[FunnelTracking] Payload:', { event_type: eventType });
    
    // Apenas registra interest_click em funnel_events
    // message_sent não é mais registrado aqui (vem de opportunities)
    if (eventType === 'interest_click') {
      const { data, error } = await supabase
        .from('funnel_events')
        .insert({ event_type: eventType })
        .select();
      
      console.log('[FunnelTracking] Supabase response:');
      console.log('[FunnelTracking] - data:', data);
      console.log('[FunnelTracking] - error:', error);
      
      if (error) {
        console.error('[FunnelTracking] ❌ ERROR tracking event:');
        console.error('[FunnelTracking] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else {
        console.log('[FunnelTracking] ✅ Event tracked successfully:', eventType);
        console.log('[FunnelTracking] Inserted data:', data);
      }
    } else {
      console.log('[FunnelTracking] ⚠️ message_sent events are tracked via opportunities table');
    }
    console.log('═══════════════════════════════════════════════════');
  } catch (error) {
    console.error('═══════════════════════════════════════════════════');
    console.error('[FunnelTracking] ❌ UNEXPECTED ERROR in trackEvent:');
    console.error('[FunnelTracking] Error:', error);
    console.error('═══════════════════════════════════════════════════');
  }
}

/**
 * Busca todas as métricas do funil de conversão
 * Usa opportunities como fonte principal
 */
export async function getFunnelMetrics(): Promise<FunnelMetrics> {
  try {
    console.log('[FunnelTracking] Fetching funnel metrics...');
    
    // Buscar contagem de interest_clicks de funnel_events
    const { data: interestData, error: interestError } = await supabase
      .from('funnel_events')
      .select('id')
      .eq('event_type', 'interest_click');
    
    if (interestError) {
      console.error('[FunnelTracking] Error fetching interest_clicks:', interestError);
    }
    
    const interestClicks = interestData?.length || 0;
    
    // Buscar todas as opportunities e agrupar por stage
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('archived', false); // Apenas não arquivadas
    
    if (oppError) {
      console.error('[FunnelTracking] Error fetching opportunities:', oppError);
    }
    
    // Contar opportunities por estágio
    const metrics: FunnelMetrics = {
      interestClicks,
      messageSent: opportunities?.length || 0,
      talkingAi: opportunities?.filter(o => o.stage === 'talking_ai').length || 0,
      talkingHuman: opportunities?.filter(o => o.stage === 'talking_human').length || 0,
      won: opportunities?.filter(o => o.stage === 'won').length || 0,
      lost: opportunities?.filter(o => o.stage === 'lost').length || 0,
      totalOpportunities: opportunities?.length || 0,
    };
    
    console.log('[FunnelTracking] Funnel metrics fetched:', metrics);
    return metrics;
    
  } catch (error) {
    console.error('[FunnelTracking] Error in getFunnelMetrics:', error);
    return {
      interestClicks: 0,
      messageSent: 0,
      talkingAi: 0,
      talkingHuman: 0,
      won: 0,
      lost: 0,
      totalOpportunities: 0,
    };
  }
}

/**
 * Busca contagem de eventos por tipo (para compatibilidade)
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
 * Calcula taxas de conversão do funil
 * @returns Taxas de conversão entre cada estágio
 */
export interface ConversionRates {
  interestToMessage: number; // interest_click → message_sent
  messageToAi: number;        // message_sent → talking_ai
  aiToHuman: number;           // talking_ai → talking_human
  humanToWon: number;          // talking_human → won
  overallConversion: number;   // interest_click → won
}

export async function getConversionRates(): Promise<ConversionRates> {
  try {
    const metrics = await getFunnelMetrics();
    
    const rates: ConversionRates = {
      interestToMessage: calculateRate(metrics.messageSent, metrics.interestClicks),
      messageToAi: calculateRate(metrics.talkingAi, metrics.messageSent),
      aiToHuman: calculateRate(metrics.talkingHuman, metrics.talkingAi),
      humanToWon: calculateRate(metrics.won, metrics.talkingHuman),
      overallConversion: calculateRate(metrics.won, metrics.interestClicks),
    };
    
    console.log('[FunnelTracking] Conversion rates:', rates);
    return rates;
    
  } catch (error) {
    console.error('[FunnelTracking] Error in getConversionRates:', error);
    return {
      interestToMessage: 0,
      messageToAi: 0,
      aiToHuman: 0,
      humanToWon: 0,
      overallConversion: 0,
    };
  }
}

/**
 * Função auxiliar para calcular taxa de conversão
 */
function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100 * 100) / 100; // 2 casas decimais
}