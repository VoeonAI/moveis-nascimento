import { supabase } from '@/core/supabaseClient';

export interface DashboardMetrics {
  totalActiveProducts: number;
  leadsByStatus: Record<string, number>;
  ordersByStage: Record<string, number>;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // Get total active products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('[dashboardService.getMetrics] products:', productsError.message);
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
        leadsByStatus,
        ordersByStage,
      };
    } catch (error) {
      console.error('[dashboardService.getMetrics]', error);
      return {
        totalActiveProducts: 0,
        leadsByStatus: {},
        ordersByStage: {},
      };
    }
  },
};