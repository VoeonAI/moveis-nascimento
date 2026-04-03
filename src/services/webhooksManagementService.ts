import { supabase } from '@/core/supabaseClient';

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
  status_code: number | null;
  success: boolean;
  error?: string;
  created_at: string;
}

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created',
  OPPORTUNITY_CREATED: 'opportunity.created',
  ORDER_CREATED: 'order.created',
  ORDER_STAGE_CHANGED: 'order.stage_changed',
  HOME_AMBIENCE_CLICK: 'home_ambience_click',
  WEBHOOK_TEST: 'webhook.test',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  [WEBHOOK_EVENTS.LEAD_CREATED]: 'Novo Lead',
  [WEBHOOK_EVENTS.ORDER_CREATED]: 'Pedido Criado',
  [WEBHOOK_EVENTS.ORDER_STAGE_CHANGED]: 'Mudança de Estágio do Pedido',
  [WEBHOOK_EVENTS.OPPORTUNITY_CREATED]: 'Nova Oportunidade',
  [WEBHOOK_EVENTS.HOME_AMBIENCE_CLICK]: 'Clique em Ambiente (Modulados)',
  [WEBHOOK_EVENTS.WEBHOOK_TEST]: 'Teste de Webhook',
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

  async testEndpoint(endpointId: string): Promise<{ success: boolean; status_code: number | null; error?: string; data?: any }> {
    console.log('[testEndpoint] Starting test for endpoint:', endpointId);
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks_dispatch', {
        body: {
          endpointId,
          eventType: 'webhook.test',
          payload: { ping: true, at: new Date().toISOString() },
        },
      });

      console.log('[testEndpoint] Response received:', { data, error });

      if (error) {
        console.error('[testEndpoint] Edge function error:', error);
        return {
          success: false,
          status_code: null,
          error: error.message || 'Erro ao chamar função de teste',
          data,
        };
      }

      if (!data?.ok) {
        console.error('[testEndpoint] Edge function returned error:', data.error);
        return {
          success: false,
          status_code: null,
          error: data.error || 'Erro desconhecido na função',
          data,
        };
      }

      // Return first result (or generic success if no results)
      const result = data.results?.[0];
      if (result) {
        return {
          success: result.success,
          status_code: result.status_code,
          error: result.error,
          data,
        };
      }

      return {
        success: true,
        status_code: 200,
        data,
      };
    } catch (error: any) {
      console.error('[testEndpoint] Unexpected error:', error);
      return {
        success: false,
        status_code: null,
        error: error.message || 'Erro de conexão',
      };
    }
  },

  async listLogs(limit: number = 100): Promise<WebhookLog[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('id, endpoint_id, event_type, success, status_code, error, payload, created_at')
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
        .select('id, endpoint_id, event_type, success, status_code, error, payload, created_at')
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