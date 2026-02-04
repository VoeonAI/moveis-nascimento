import { supabase } from '@/core/supabaseClient';
import { webhooksService } from './webhooksService';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, any>;
  status_code: number;
  success: boolean;
  error?: string;
  created_at: string;
}

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created_from_interest',
  ORDER_CREATED: 'order.created',
  ORDER_STAGE_CHANGED: 'order.stage_changed',
  OPPORTUNITY_CREATED: 'opportunity.created_from_interest',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  [WEBHOOK_EVENTS.LEAD_CREATED]: 'Novo Lead',
  [WEBHOOK_EVENTS.ORDER_CREATED]: 'Pedido Criado',
  [WEBHOOK_EVENTS.ORDER_STAGE_CHANGED]: 'Mudança de Estágio do Pedido',
  [WEBHOOK_EVENTS.OPPORTUNITY_CREATED]: 'Nova Oportunidade',
};

export const webhooksManagementService = {
  async listEndpoints(): Promise<WebhookEndpoint[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[webhooksManagementService.listEndpoints]', error);
      return [];
    }
  },

  async getEndpoint(id: string): Promise<WebhookEndpoint | null> {
    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[webhooksManagementService.getEndpoint]', error);
      return null;
    }
  },

  async createEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'created_at'>): Promise<WebhookEndpoint> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert(endpoint)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEndpoint(id: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async testEndpoint(endpoint: WebhookEndpoint): Promise<{ success: boolean; statusCode: number; error?: string }> {
    try {
      // Use webhooksService.emit for consistent testing
      await webhooksService.emit('webhook.test', {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Teste de webhook',
        endpoint_name: endpoint.name,
      });

      // Wait a moment for the async webhook to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check recent logs for this endpoint
      const { data: recentLogs, error: logsError } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('endpoint_id', endpoint.id)
        .eq('event_type', 'webhook.test')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logsError || !recentLogs) {
        return {
          success: false,
          statusCode: 0,
          error: 'Não foi possível verificar o resultado do teste',
        };
      }

      return {
        success: recentLogs.success,
        statusCode: recentLogs.status_code,
        error: recentLogs.error || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: 0,
        error: error.message || 'Erro de conexão',
      };
    }
  },

  async listLogs(limit: number = 50): Promise<WebhookLog[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select(`
          *,
          webhook_endpoints (name, url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[webhooksManagementService.listLogs]', error);
      return [];
    }
  },

  async getLogsByEndpoint(endpointId: string, limit: number = 20): Promise<WebhookLog[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[webhooksManagementService.getLogsByEndpoint]', error);
      return [];
    }
  },
};