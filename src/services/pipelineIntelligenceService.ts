import { supabase } from '@/core/supabaseClient';

export interface StuckOrder {
  id: string;
  internal_code: string | null;
  customer_name: string | null;
  current_stage: string;
  updated_at: string;
}

export interface DelayedDelivery {
  id: string;
  internal_code: string | null;
  customer_name: string | null;
  updated_at: string;
}

export interface PendingOrder {
  id: string;
  internal_code: string | null;
  customer_name: string | null;
  updated_at: string;
}

export interface PipelineRadar {
  stuckOrders: StuckOrder[];
  stuckOrdersCount: number;
  delayedDeliveries: DelayedDelivery[];
  delayedDeliveriesCount: number;
  pendingOrders: PendingOrder[];
  pendingOrdersCount: number;
}

export const pipelineIntelligenceService = {
  async getPipelineRadar(): Promise<PipelineRadar> {
    try {
      // 1. Pedidos Travados (muito tempo no mesmo estágio)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Buscar pedidos que podem estar travados
      const { data: stuckOrders, error: stuckError } = await supabase
        .from('orders')
        .select('id, internal_code, customer_name, current_stage, updated_at')
        .in('current_stage', ['order_created', 'preparing_order', 'assembly', 'ready_to_ship', 'delivery_route'])
        .order('updated_at', { ascending: true });

      let stuckOrdersFiltered: StuckOrder[] = [];
      if (stuckError) {
        console.error('[pipelineIntelligenceService.getPipelineRadar] stuck orders:', stuckError.message);
      } else {
        // Filtrar pedidos travados baseado nas regras de tempo
        stuckOrdersFiltered = (stuckOrders || []).filter(order => {
          const updatedAt = new Date(order.updated_at);
          
          switch (order.current_stage) {
            case 'order_created':
              return updatedAt < oneDayAgo;
            case 'preparing_order':
              return updatedAt < twoDaysAgo;
            case 'assembly':
              return updatedAt < threeDaysAgo;
            case 'ready_to_ship':
              return updatedAt < twoDaysAgo;
            case 'delivery_route':
              return updatedAt < twoDaysAgo;
            default:
              return false;
          }
        }).slice(0, 5);
      }

      // Contar total de pedidos travados
      const stuckOrdersCount = stuckOrdersFiltered.length;

      // 2. Entregas Atrasadas (em rota há mais de 2 dias)
      const { data: delayedDeliveries, error: delayedError } = await supabase
        .from('orders')
        .select('id, internal_code, customer_name, updated_at')
        .eq('current_stage', 'delivery_route')
        .lte('updated_at', twoDaysAgo.toISOString())
        .order('updated_at', { ascending: true })
        .limit(5);

      let delayedDeliveriesCount = 0;
      if (delayedError) {
        console.error('[pipelineIntelligenceService.getPipelineRadar] delayed deliveries:', delayedError.message);
      } else {
        // Contar total de entregas atrasadas
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('current_stage', 'delivery_route')
          .lte('updated_at', twoDaysAgo.toISOString());
        
        delayedDeliveriesCount = count || 0;
      }

      // 3. Pedidos Aguardando Ação (em "order_created" há mais de 24h)
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('id, internal_code, customer_name, updated_at')
        .eq('current_stage', 'order_created')
        .lte('updated_at', oneDayAgo.toISOString())
        .order('updated_at', { ascending: true })
        .limit(5);

      let pendingOrdersCount = 0;
      if (pendingError) {
        console.error('[pipelineIntelligenceService.getPipelineRadar] pending orders:', pendingError.message);
      } else {
        // Contar total de pedidos aguardando
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('current_stage', 'order_created')
          .lte('updated_at', oneDayAgo.toISOString());
        
        pendingOrdersCount = count || 0;
      }

      return {
        stuckOrders: stuckOrdersFiltered,
        stuckOrdersCount,
        delayedDeliveries: delayedDeliveries || [],
        delayedDeliveriesCount,
        pendingOrders: pendingOrders || [],
        pendingOrdersCount,
      };
    } catch (error) {
      console.error('[pipelineIntelligenceService.getPipelineRadar]', error);
      return {
        stuckOrders: [],
        stuckOrdersCount: 0,
        delayedDeliveries: [],
        delayedDeliveriesCount: 0,
        pendingOrders: [],
        pendingOrdersCount: 0,
      };
    }
  },
};