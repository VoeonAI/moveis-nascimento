import { supabase } from '@/core/supabaseClient';

export type ClickSource = 'catalog' | 'home' | 'search';
export type EventType = 'click' | 'interest_open';

/**
 * Registra um clique em um produto de forma não-bloqueante
 * NOTA: Descontinuado em favor de trackProductInterest para medir interesse real
 */
export async function trackProductClick(productId: string, source: ClickSource = 'catalog'): Promise<void> {
  // Tracking de clique simples descontinuado - não faz nada
  console.warn('[ProductClicks] trackProductClick is deprecated. Use trackProductInterest instead.');
}

/**
 * Registra um interesse real em um produto (abertura do modal)
 * Não afeta o fluxo de navegação do usuário
 */
export async function trackProductInterest(productId: string): Promise<void> {
  try {
    console.log('[ProductClicks] Tracking interest for product:', productId);
    
    // Gera um session_id simples se não existir (armazenado em sessionStorage)
    let sessionId = sessionStorage.getItem('click_tracking_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('click_tracking_session', sessionId);
    }

    // Insere de forma assíncrona sem await para não bloquear navegação
    supabase
      .from('product_clicks')
      .insert({
        product_id: productId,
        source: 'product_modal',
        session_id: sessionId,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('[ProductClicks] Failed to track interest:', error.message);
        } else {
          console.log('[ProductClicks] Interest tracked successfully for product:', productId);
        }
      });
  } catch (error) {
    // Silencioso - não deve afetar UX do usuário
    console.warn('[ProductClicks] Error tracking interest:', error);
  }
}

/**
 * Obtém o total de cliques de um produto específico
 */
export async function getProductClicksCount(productId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_product_clicks_count', {
      p_product_id: productId,
    });

    if (error) {
      console.error('[ProductClicks] Failed to get clicks count:', error);
      return 0;
    }

    return (data as number) || 0;
  } catch (error) {
    console.error('[ProductClicks] Error getting clicks count:', error);
    return 0;
  }
}

/**
 * Obtém o total geral de cliques de todos os produtos
 */
export async function getAllProductsClicksCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('product_clicks')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[ProductClicks] Failed to get total clicks:', error);
      return 0;
    }

    return (data as any)?.count || 0;
  } catch (error) {
    console.error('[ProductClicks] Error getting total clicks:', error);
    return 0;
  }
}

/**
 * Obtém contagem de cliques por produto (ordenado por mais clicados)
 */
export async function getProductsClicksByProduct(): Promise<Array<{ product_id: string; click_count: number }>> {
  try {
    const { data, error } = await supabase.rpc('get_all_products_clicks_count');

    if (error) {
      console.error('[ProductClicks] Failed to get clicks by product:', error);
      return [];
    }

    return (data as Array<{ product_id: string; click_count: number }>) || [];
  } catch (error) {
    console.error('[ProductClicks] Error getting clicks by product:', error);
    return [];
  }
}

/**
 * Obtém estatísticas de cliques por fonte (catalog, home, search)
 */
export async function getClicksBySource(): Promise<Record<ClickSource, number>> {
  try {
    const { data, error } = await supabase
      .from('product_clicks')
      .select('source')
      .not('source', 'is', null);

    if (error) {
      console.error('[ProductClicks] Failed to get clicks by source:', error);
      return { catalog: 0, home: 0, search: 0 };
    }

    const counts: Record<ClickSource, number> = {
      catalog: 0,
      home: 0,
      search: 0,
    };

    data?.forEach((click: { source: ClickSource }) => {
      if (click.source && counts[click.source] !== undefined) {
        counts[click.source]++;
      }
    });

    return counts;
  } catch (error) {
    console.error('[ProductClicks] Error getting clicks by source:', error);
    return { catalog: 0, home: 0, search: 0 };
  }
}

/**
 * Obtém cliques dos últimos N dias
 */
export async function getClicksLastDays(days: number = 30): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('product_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[ProductClicks] Failed to get clicks last days:', error);
      return 0;
    }

    return (data as any)?.count || 0;
  } catch (error) {
    console.error('[ProductClicks] Error getting clicks last days:', error);
    return 0;
  }
}

// Exportar como objeto para facilitar importação no dashboard
export const productClicksService = {
  trackProductClick,
  getProductClicksCount,
  getAllProductsClicksCount,
  getProductsClicksByProduct,
  getClicksBySource,
  getClicksLastDays,
};