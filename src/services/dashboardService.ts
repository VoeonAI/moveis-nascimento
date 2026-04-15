import { supabase } from '@/core/supabaseClient';
import { productClicksService } from './productClicksService';
import { Product } from '@/services/productsService';

export type PeriodType = 'today' | 'last_7_days' | 'last_30_days' | 'current_month' | 'last_month' | 'last_6_months';

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

export interface SystemOverview {
  totalProducts: number;
  totalLeads: number;
  totalOpportunities: number;
  totalUsers: number;
  totalDelivered: number;
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

export interface BehavioralFunnel {
  stage: string;
  count: number;
  label: string;
  color: string;
}

export interface EvolutionData {
  month: string;
  leads: number;
  ordersDelivered: number;
}

export interface ProductClicksMetrics {
  totalClicks: number;
  clicksBySource: Record<string, number>;
  clicksByProduct: Array<{ product_id: string; click_count: number; product_name?: string }>;
  clicksLast30Days: number;
}

export interface ProductWithClicks extends Product {
  click_count?: number;
}

// Helper to get date range based on period
function getDateRange(period: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'last_7_days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_30_days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'current_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: lastMonthEnd };
    case 'last_6_months':
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

export const dashboardService = {
  async getSystemOverview(): Promise<SystemOverview> {
    try {
      // Get total active products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('[dashboardService.getSystemOverview] products:', productsError.message);
      }

      // Get total leads (not archived)
      const { count: totalLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('archived', false);

      if (leadsError) {
        console.error('[dashboardService.getSystemOverview] leads:', leadsError.message);
      }

      // Get total opportunities
      const { count: totalOpportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true });

      if (oppsError) {
        console.error('[dashboardService.getSystemOverview] opportunities:', oppsError.message);
      }

      // Get total active users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (usersError) {
        console.error('[dashboardService.getSystemOverview] users:', usersError.message);
      }

      // Get total delivered orders
      const { count: totalDelivered, error: deliveredError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', 'delivered');

      if (deliveredError) {
        console.error('[dashboardService.getSystemOverview] delivered:', deliveredError.message);
      }

      return {
        totalProducts: totalProducts || 0,
        totalLeads: totalLeads || 0,
        totalOpportunities: totalOpportunities || 0,
        totalUsers: totalUsers || 0,
        totalDelivered: totalDelivered || 0,
      };
    } catch (error) {
      console.error('[dashboardService.getSystemOverview]', error);
      return {
        totalProducts: 0,
        totalLeads: 0,
        totalOpportunities: 0,
        totalUsers: 0,
        totalDelivered: 0,
      };
    }
  },

  async getMetrics(period: PeriodType = 'last_30_days'): Promise<DashboardMetrics> {
    try {
      const { start, end } = getDateRange(period);

      // Get total active products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('[dashboardService.getMetrics] products:', productsError.message);
      }

      // Get leads in period
      const { count: leadsInPeriod, error: leadsPeriodError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

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

      // Get won in period
      const { count: wonInPeriod, error: wonError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'won')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (wonError) {
        console.error('[dashboardService.getMetrics] won:', wonError.message);
      }

      // Get lost in period
      const { count: lostInPeriod, error: lostError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'lost')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (lostError) {
        console.error('[dashboardService.getMetrics] lost:', lostError.message);
      }

      // Get delivered in period
      const { count: deliveredInPeriod, error: deliveredError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', 'delivered')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

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

  async getOpportunityFunnel(period: PeriodType = 'last_30_days'): Promise<OpportunityFunnel[]> {
    try {
      const { start, end } = getDateRange(period);

      const { data, error } = await supabase
        .from('opportunities')
        .select('stage')
        .eq('archived', false)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

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

  async getOrdersPipeline(period: PeriodType = 'last_30_days'): Promise<OrdersPipeline[]> {
    try {
      const { start, end } = getDateRange(period);

      const { data, error } = await supabase
        .from('orders')
        .select('current_stage')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

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

  async getEvolutionByPeriod(period: PeriodType = 'last_6_months'): Promise<EvolutionData[]> {
    try {
      const { start, end } = getDateRange(period);

      // Get leads by month
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (leadsError) {
        console.error('[dashboardService.getEvolutionByPeriod] leads:', leadsError.message);
      }

      const leadsByMonth = (leads || []).reduce((acc, lead) => {
        const month = new Date(lead.created_at).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get delivered orders by month
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at')
        .eq('current_stage', 'delivered')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

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

  async getBehavioralFunnel(period: PeriodType = 'last_30_days'): Promise<BehavioralFunnel[]> {
    try {
      const { start, end } = getDateRange(period);

      // 1. Cliques de interesse (funnel_events)
      const { data: clicksData, error: clicksError } = await supabase
        .from('funnel_events')
        .select('event_type')
        .eq('event_type', 'interest_click')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (clicksError) {
        console.error('[dashboardService.getBehavioralFunnel] clicks:', clicksError.message);
      }

      const interestClicks = clicksData?.length || 0;

      // 2. Interestes (todas as opportunities no período)
      const { data: oppsData, error: oppsError } = await supabase
        .from('opportunities')
        .select('stage')
        .eq('archived', false)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (oppsError) {
        console.error('[dashboardService.getBehavioralFunnel] opportunities:', oppsError.message);
      }

      // Contar por estágio
      const funnel = (oppsData || []).reduce((acc, opp) => {
        acc[opp.stage] = (acc[opp.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalInterests = oppsData?.length || 0;
      const talkingAi = funnel['talking_ai'] || 0;
      const talkingHuman = funnel['talking_human'] || 0;
      const won = funnel['won'] || 0;

      // Retornar dados do funil comportamental
      return [
        {
          stage: 'interest_click',
          count: interestClicks,
          label: 'Cliques',
          color: '#3b82f6', // blue-500
        },
        {
          stage: 'interest',
          count: totalInterests,
          label: 'Interesse',
          color: '#22c55e', // green-500
        },
        {
          stage: 'talking_ai',
          count: talkingAi,
          label: 'Conversando com IA',
          color: '#a855f7', // purple-500
        },
        {
          stage: 'talking_human',
          count: talkingHuman,
          label: 'Conversando com Humano',
          color: '#f97316', // orange-500
        },
        {
          stage: 'won',
          count: won,
          label: 'Ganho',
          color: '#eab308', // yellow-500
        },
      ];
    } catch (error) {
      console.error('[dashboardService.getBehavioralFunnel]', error);
      return [];
    }
  },

  /**
   * Obtém métricas de cliques de produtos para análise de funil
   */
  async getProductClicksMetrics(): Promise<ProductClicksMetrics> {
    try {
      const [totalClicks, clicksBySource, clicksByProduct, clicksLast30Days] = await Promise.all([
        productClicksService.getAllProductsClicksCount(),
        productClicksService.getClicksBySource(),
        productClicksService.getProductsClicksByProduct(),
        productClicksService.getClicksLastDays(30),
      ]);

      // Obter nomes dos produtos para os mais clicados (top 10)
      const topProducts = clicksByProduct.slice(0, 10);
      const productIds = topProducts.map(p => p.product_id);
      
      let productsWithNames: Array<{ product_id: string; click_count: number; product_name?: string }> = topProducts;
      
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        
        const productMap = new Map((products || []).map(p => [p.id, p.name]));
        
        productsWithNames = topProducts.map(item => ({
          ...item,
          product_name: productMap.get(item.product_id),
        }));
      }

      return {
        totalClicks,
        clicksBySource,
        clicksByProduct: productsWithNames,
        clicksLast30Days,
      };
    } catch (error) {
      console.error('[dashboardService.getProductClicksMetrics]', error);
      return {
        totalClicks: 0,
        clicksBySource: { catalog: 0, home: 0, search: 0 },
        clicksByProduct: [],
        clicksLast30Days: 0,
      };
    }
  },
};