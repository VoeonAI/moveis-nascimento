import { supabase } from '@/core/supabaseClient';
import { Order, OrderEvent } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { webhooksService } from './webhooksService';

export const ordersService = {
  async createOrderFromOpportunity(opportunityId: string): Promise<Order> {
    // 0. Check for existing order (Idempotency)
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (checkError) {
      console.error('[ordersService.createOrderFromOpportunity] Check error:', checkError);
      // Continue to creation if check fails (might be a permission issue or other)
    }

    if (existingOrder) {
      console.log('[ordersService.createOrderFromOpportunity] Order already exists, returning existing:', existingOrder.id);
      return existingOrder;
    }

    // 1. Fetch opportunity details with lead info
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        *,
        leads (*)
      `)
      .eq('id', opportunityId)
      .single();

    if (oppError) throw oppError;

    const lead = opportunity.leads;
    if (!lead) throw new Error('Lead not found for this opportunity');

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        opportunity_id: opportunity.id,
        lead_id: lead.id,
        current_stage: OrderStage.ORDER_CREATED,
        customer_name: lead.name,
        customer_phone: lead.phone,
        total_value: opportunity.estimated_value || 0,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Create initial Order Event
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: order.id,
        from_stage: null,
        to_stage: OrderStage.ORDER_CREATED,
        note: 'Pedido criado automaticamente a partir da oportunidade',
      });

    if (eventError) throw eventError;

    // 4. Emit Webhook
    await webhooksService.emit('order.created', { order, opportunity });

    return order;
  },

  async listOrdersByStage(): Promise<Record<OrderStage, Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Initialize empty object for all stages
      const grouped = ORDER_STAGES_FLOW.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
      }, {} as Record<OrderStage, Order[]>);

      // Group orders by stage
      (data || []).forEach((order) => {
        if (grouped[order.current_stage]) {
          grouped[order.current_stage].push(order);
        }
      });

      return grouped;
    } catch (error) {
      console.error('[ordersService.listOrdersByStage]', error);
      return ORDER_STAGES_FLOW.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
      }, {} as Record<OrderStage, Order[]>);
    }
  },

  async moveOrderStage(
    orderId: string,
    toStage: OrderStage,
    userId: string,
    note?: string
  ): Promise<Order> {
    // 1. Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    const fromStage = currentOrder.current_stage; // Fixed: was .stage

    // 2. Update Order Stage
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        current_stage: toStage, 
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
        note: note || `Movido de ${fromStage} para ${toStage}`,
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