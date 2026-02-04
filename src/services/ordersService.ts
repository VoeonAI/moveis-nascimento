import { supabase } from '@/core/supabaseClient';
import { Order, OrderEvent } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { webhooksService } from './webhooksService';

// Type alias for the complex return type
type OrderWithProduct = Order & { 
  opportunities?: { 
    product_id: string; 
    products?: { 
      id: string; 
      name: string 
    } 
  } 
};

type OrdersByStage = Record<OrderStage, OrderWithProduct[]>;

export const ordersService = {
  async ensureOrderForOpportunity(opportunityId: string, userId?: string): Promise<Order> {
    console.log('[ensureOrderForOpportunity] Checking for existing order', { opportunityId });

    // 1. Check if order already exists (Idempotency)
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (checkError) {
      console.error('[ensureOrderForOpportunity] Check error:', checkError.message);
    }

    if (existingOrder) {
      console.log('[ensureOrderForOpportunity] Order already exists, returning:', existingOrder.id);
      return existingOrder;
    }

    // 2. Fetch opportunity with lead info
    console.log('[ensureOrderForOpportunity] Fetching opportunity...');
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        *,
        leads (*)
      `)
      .eq('id', opportunityId)
      .single();

    if (oppError) {
      console.error('[ensureOrderForOpportunity]', oppError.message);
      throw oppError;
    }

    const lead = opportunity.leads;
    if (!lead) {
      throw new Error('Lead not found for this opportunity');
    }

    // 3. Create order with minimal fields
    console.log('[ensureOrderForOpportunity] Creating order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        opportunity_id: opportunityId,
        current_stage: OrderStage.ORDER_CREATED,
        customer_name: lead.name,
        customer_phone: lead.phone,
        total_value: opportunity.estimated_value || 0,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[ensureOrderForOpportunity]', orderError.message);
      throw orderError;
    }

    console.log('[ensureOrderForOpportunity] Order created:', order.id);

    // 4. Create initial order event
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: order.id,
        from_stage: null,
        to_stage: OrderStage.ORDER_CREATED,
        note: 'Pedido criado automaticamente',
        created_by: userId,
      });

    if (eventError) {
      console.error('[ensureOrderForOpportunity]', eventError.message);
      throw eventError;
    }

    // 5. Emit webhook
    try {
      await webhooksService.emit('order.created', { order, opportunity });
    } catch (webhookError) {
      console.warn('[ensureOrderForOpportunity] Webhook failed:', webhookError);
    }

    return order;
  },

  async createOrderFromOpportunity(opportunityId: string, userId?: string): Promise<Order> {
    console.log('[createOrderFromOpportunity] Starting', { opportunityId, userId });

    // 0. Check for existing order (Idempotency)
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (checkError) {
      console.error('[createOrderFromOpportunity] Check error:', checkError.message, checkError.details);
    }

    if (existingOrder) {
      console.log('[createOrderFromOpportunity] Order already exists, returning existing:', existingOrder.id);
      return existingOrder;
    }

    // 1. Fetch opportunity details with lead info
    console.log('[createOrderFromOpportunity] Fetching opportunity...');
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        *,
        leads (*)
      `)
      .eq('id', opportunityId)
      .single();

    if (oppError) {
      console.error('[createOrderFromOpportunity] Opportunity fetch error:', oppError.message, oppError.details);
      throw oppError;
    }

    const lead = opportunity.leads;
    if (!lead) {
      console.error('[createOrderFromOpportunity] Lead not found for opportunity:', opportunityId);
      throw new Error('Lead not found for this opportunity');
    }

    console.log('[createOrderFromOpportunity] Creating order with minimal insert...');
    // 2. Create Order - insert MINIMAL (apenas campos obrigatórios)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        opportunity_id: opportunityId,
        current_stage: OrderStage.ORDER_CREATED,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[createOrderFromOpportunity] Order insert error:', orderError.message, orderError.details);
      throw orderError;
    }

    console.log('[createOrderFromOpportunity] Order created:', order.id);

    // 3. Create initial Order Event
    console.log('[createOrderFromOpportunity] Creating order event...');
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: order.id,
        from_stage: null,
        to_stage: OrderStage.ORDER_CREATED,
        note: 'Pedido criado',
        created_by: userId,
      });

    if (eventError) {
      console.error('[createOrderFromOpportunity] Order event error:', eventError.message, eventError.details);
      throw eventError;
    }

    console.log('[createOrderFromOpportunity] Order event created');

    // 4. Emit Webhook (best-effort, não trava se falhar)
    try {
      await webhooksService.emit('order.created', { order, opportunity });
    } catch (webhookError) {
      console.warn('[createOrderFromOpportunity] Webhook failed (non-critical):', webhookError);
    }

    console.log('[createOrderFromOpportunity] Completed successfully');
    return order;
  },

  async updateOrderStage(
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

    if (fetchError) {
      console.error('[updateOrderStage]', fetchError.message);
      throw fetchError;
    }

    const fromStage = currentOrder.current_stage;

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

    if (updateError) {
      console.error('[updateOrderStage]', updateError.message);
      throw updateError;
    }

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

    if (eventError) {
      console.error('[updateOrderStage]', eventError.message);
      throw eventError;
    }

    // 4. Emit Webhook
    await webhooksService.emit('order.stage_changed', {
      order: updatedOrder,
      event: { order_id: orderId, from_stage: fromStage, to_stage: toStage },
    });

    return updatedOrder;
  },

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[updateOrder]', error.message);
      throw error;
    }

    return data;
  },

  async listOrdersByStage(): Promise<OrdersByStage> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, opportunities (product_id, products (id, name))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Initialize empty object for all stages
      const grouped = ORDER_STAGES_FLOW.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
      }, {} as OrdersByStage);

      // Group orders by stage
      (data || []).forEach((order) => {
        if (grouped[order.current_stage]) {
          grouped[order.current_stage].push(order);
        }
      });

      return grouped;
    } catch (error: any) {
      console.error('[ordersService.listOrdersByStage]', error.message, error.details);
      return ORDER_STAGES_FLOW.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
      }, {} as OrdersByStage);
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

    if (fetchError) {
      console.error('[moveOrderStage]', fetchError.message, fetchError.details);
      throw fetchError;
    }

    const fromStage = currentOrder.current_stage;

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

    if (updateError) {
      console.error('[moveOrderStage]', updateError.message, updateError.details);
      throw updateError;
    }

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

    if (eventError) {
      console.error('[moveOrderStage]', eventError.message, eventError.details);
      throw eventError;
    }

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
        console.error('[listOrders]', error.message, error.details);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[listOrders]', error.message, error.details);
      return [];
    }
  },
};