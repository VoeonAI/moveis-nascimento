import { supabase } from '@/core/supabaseClient';
import { Order, OrderEvent } from '@/types';
import { OrderStage } from '@/constants/domain';
import { webhooksService } from './webhooksService';

export const ordersService = {
  async moveOrderStage(
    orderId: string,
    toStage: OrderStage,
    userId: string
  ): Promise<Order> {
    // 1. Get current order to determine previous stage
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    const fromStage = currentOrder.stage;

    // 2. Update Order Stage
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        stage: toStage, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Create Order Event
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        from_stage: fromStage,
        to_stage: toStage,
        triggered_by: userId,
      });

    if (eventError) throw eventError;

    // 4. Emit Webhook
    await webhooksService.emit('order.stage_changed', {
      order: updatedOrder,
      event: { order_id: orderId, from_stage: fromStage, to_stage: toStage },
    });

    return updatedOrder;
  },

  async listOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ordersService.listOrders]', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[ordersService.listOrders]', error);
      return [];
    }
  },
};