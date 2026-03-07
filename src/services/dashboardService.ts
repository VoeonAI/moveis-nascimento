import { supabase } from '@/core/supabaseClient';

export interface DashboardMetrics {
  totalActiveProducts: number;
  leadsByStatus: Record<string, number>;
  ordersByStage: Record<string, number>;
  // New KPIs
  leadsInPeriod: number;
  activeOpportunities: number;
  wonInPeriod: number;
  lostInPeriod: number;
  deliveredInPeriod: number;
}

export interface OpportunityFunnel {
  stage: string;
  count: number;
  label: string;
}

export interface OrdersPipeline {
  stage: string;
  count: number;
  label: string;
}

export interface EvolutionData {
  month: string;
  leads: number;
  ordersDelivered: number;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get total active products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('[dashboardService.getMetrics] products:', productsError.message);
      }

      // Get leads in period (last 30 days)
      const { count: leadsInPeriod, error: leadsPeriodError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (leadsPeriodError) {
        console.error('[dashboardService.getMetrics] leads period:', leadsPeriodError.message);
      }

      // Get active opportunities (not won, not lost)
      const { count: activeOpportunities, error: oppsActiveError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .not('stage', 'in', '("won", "lost")')
        .eq('archived', false);

      if (oppsActiveError) {
        console.error('[dashboardService.getMetrics] active opportunities:', oppsActiveError.message);
      }

      // Get won in period (last 30 days)
      const { count: wonInPeriod, error: wonError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'won')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (wonError) {
        console.error('[dashboardService.getMetrics] won:', wonError.message);
      }

      // Get lost in period (last 30 days)
      const { count: lostInPeriod, error: lostError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'lost')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (lostError) {
        console.error('[dashboardService.getMetrics] lost:', lostError.message);
      }

      // Get delivered in period (last 30 days)
      const { count: deliveredInPeriod, error: deliveredError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', 'delivered')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (deliveredError) {
        console.error('[dashboardService.getMetrics] delivered:', deliveredError.message);
      }

      // Get leads by status
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('status');

      if (leadsError) {
        console.error('[dashboardService.getMetrics] leads:', leadsError.message);
      }

      const leadsByStatus = (leads || []).reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get orders by stage
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('current_stage');

      if (ordersError) {
        console.error('[dashboardService.getMetrics] orders:', ordersError.message);
      }

      const ordersByStage = (orders || []).reduce((acc, order) => {
        acc[order.current_stage] = (acc[order.current_stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalActiveProducts: totalProducts || 0,
        leadsInPeriod: leadsInPeriod || 0,
        activeOpportunities: activeOpportunities || 0,
        wonInPeriod: wonInPeriod || 0,
        lostInPeriod: lostInPeriod || 0,
        deliveredInPeriod: deliveredInPeriod || 0,
        leadsByStatus,
        ordersByStage,
      };
    } catch (error) {
      console.error('[dashboardService.getMetrics]', error);
      return {
        totalActiveProducts: 0,
        leadsInPeriod: 0,
        activeOpportunities: 0,
        wonInPeriod: 0,
        lostInPeriod: 0,
        deliveredInPeriod: 0,
        leadsByStatus: {},
        ordersByStage: {},
      };
    }
  },

  async getOpportunityFunnel(): Promise<OpportunityFunnel[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('stage')
        .eq('archived', false);

      if (error) throw error;

      const funnel = (data || []).reduce((acc, opp) => {
        acc[opp.stage] = (acc[opp.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stages = ['talking_ai', 'talking_human', 'proposal_sent', 'won', 'lost'];
      const { OPPORTUNITY_STAGE_LABELS } = await import('@/constants/labels');

      return stages.map(stage => ({
        stage,
        count: funnel[stage] || 0,
        label: OPPORTUNITY_STAGE_LABELS[stage] || stage,
      }));
    } catch (error) {
      console.error('[dashboardService.getOpportunityFunnel]', error);
      return [];
    }
  },

  async getOrdersPipeline(): Promise<OrdersPipeline[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('current_stage');

      if (error) throw error;

      const pipeline = (data || []).reduce((acc, order) => {
        acc[order.current_stage] = (acc[order.current_stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stages = ['order_created', 'preparing_order', 'assembly', 'ready_to_ship', 'delivery_route', 'delivered'];
      const { ORDER_STAGE_LABELS } = await import('@/constants/labels');

      return stages.map(stage => ({
        stage,
        count: pipeline[stage] || 0,
        label: ORDER_STAGE_LABELS[stage] || stage,
      }));
    } catch (error) {
      console.error('[dashboardService.getOrdersPipeline]', error);
      return [];
    }
  },

  async getEvolutionByPeriod(): Promise<EvolutionData[]> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get leads by month (last 6 months)
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (leadsError) {
        console.error('[dashboardService.getEvolutionByPeriod] leads:', leadsError.message);
      }

      const leadsByMonth = (leads || []).reduce((acc, lead) => {
        const month = new Date(lead.created_at).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get delivered orders by month (last 6 months)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at')
        .eq('current_stage', 'delivered')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (ordersError) {
        console.error('[dashboardService.getEvolutionByPeriod] orders:', ordersError.message);
      }

      const ordersByMonth = (orders || []).reduce((acc, order) => {
        const month = new Date(order.created_at).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Combine all months
      const allMonths = new Set([...Object.keys(leadsByMonth), ...Object.keys(ordersByMonth)]);
      const sortedMonths = Array.from(allMonths).sort();

      return sortedMonths.map(month => ({
        month,
        leads: leadsByMonth[month] || 0,
        ordersDelivered: ordersByMonth[month] || 0,
      }));
    } catch (error) {
      console.error('[dashboardService.getEvolutionByPeriod]', error);
      return [];
    }
  },
};