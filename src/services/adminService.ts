import { supabase } from '@/core/supabaseClient';

export const adminService = {
  async hardDeleteLead(leadId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin_hard_delete', {
      body: { type: 'lead', id: leadId },
    });

    if (error) {
      console.error('[adminService.hardDeleteLead] Error:', error);
      throw new Error(error.message || 'Erro ao excluir lead');
    }

    if (!data?.ok) {
      console.error('[adminService.hardDeleteLead] Function error:', data.error);
      throw new Error(data.error || 'Erro ao excluir lead');
    }
  },

  async hardDeleteOrder(orderId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin_hard_delete', {
      body: { type: 'order', id: orderId },
    });

    if (error) {
      console.error('[adminService.hardDeleteOrder] Error:', error);
      throw new Error(error.message || 'Erro ao excluir pedido');
    }

    if (!data?.ok) {
      console.error('[adminService.hardDeleteOrder] Function error:', data.error);
      throw new Error(data.error || 'Erro ao excluir pedido');
    }
  },
};