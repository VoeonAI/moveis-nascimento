import { supabase } from '@/core/supabaseClient';
import { Order, OrderEvent } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { webhooksService, WEBHOOK_EVENTS } from './webhooksService';

// Type alias for complex return type including lead and product data
type OrderWithDetails = Order & { 
  opportunities?: { 
    lead_id: string;
    product_id: string; 
    leads?: { 
      name: string;
      phone: string;
    }; 
    products?: { 
      id: string; 
      name: string 
    } 
  } 
};

type OrdersByStage = Record<OrderStage, OrderWithDetails[]>;

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

    // 3. Create order with minimal fields + customer data from lead
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

    // 4. Create initial order event (best-effort)
    try {
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
        console.error('[ensureOrderForOpportunity] Failed to create order event (non-critical):', eventError.message);
      }
    } catch (eventError) {
      console.error('[ensureOrderForOpportunity] Failed to create order event (non-critical):', eventError);
    }

    // 5. Emit webhook (best-effort)
    webhooksService.emit(
      WEBHOOK_EVENTS.ORDER_CREATED,
      {
        order_id: order.id,
        opportunity_id: opportunityId,
        lead_id: lead.id,
        product_id: opportunity.product_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        internal_order_code: order.internal_order_code ?? null,
        delivery_address: order.delivery_address ?? null,
        notes: order.notes ?? null,
      },
      'crm'
    ).catch(err => console.error('[ensureOrderForOpportunity] Webhook failed:', err));

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

    // 3. Create initial Order Event (best-effort)
    try {
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
        console.error('[createOrderFromOpportunity] Failed to create order event (non-critical):', eventError.message, eventError.details);
      }
    } catch (eventError) {
      console.error('[createOrderFromOpportunity] Failed to create order event (non-critical):', eventError);
    }

    console.log('[createOrderFromOpportunity] Order event created (or failed gracefully)');

    // 4. Emit Webhook (best-effort, não trava se falhar)
    webhooksService.emit(
      WEBHOOK_EVENTS.ORDER_CREATED,
      {
        order_id: order.id,
        opportunity_id: opportunityId,
        lead_id: lead.id,
        product_id: opportunity.product_id,
        customer_name: order.customer_name ?? null,
        customer_phone: order.customer_phone ?? null,
        internal_order_code: order.internal_order_code ?? null,
        delivery_address: order.delivery_address ?? null,
        notes: order.notes ?? null,
      },
      'crm'
    ).catch(err => console.error('[createOrderFromOpportunity] Webhook failed:', err));

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
      console.error('[updateOrderStage] Fetch error:', fetchError.message, fetchError.details);
      throw fetchError;
    }

    const fromStage = currentOrder.current_stage;

    // 2. Update Order Stage (CRITICAL - must succeed)
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
      console.error('[updateOrderStage] Update error:', updateError.message, updateError.details);
      throw updateError;
    }

    // 3. Create Order Event (best-effort - don't fail if this fails)
    try {
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
        console.error('[updateOrderStage] Failed to create order event (non-critical):', eventError.message, eventError.details);
      }
    } catch (eventError) {
      console.error('[updateOrderStage] Failed to create order event (non-critical):', eventError);
    }

    // 4. Emit Webhook (best-effort)
    webhooksService.emit(
      WEBHOOK_EVENTS.ORDER_STAGE_CHANGED,
      {
        order_id: orderId,
        from_stage: fromStage,
        to_stage: toStage,
      },
      'pipeline'
    ).catch(err => console.error('[updateOrderStage] Webhook failed:', err));

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
      console.error('[updateOrder]', error.message, error.details);
      throw error;
    }

    return data;
  },

  async listOrdersByStage(): Promise<OrdersByStage> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          opportunities (
            lead_id,
            product_id,
            leads (name, phone),
            products (id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Initialize empty object for all stages
      const grouped = ORDER_STAGES_FLOW.reduce((acc, stage) => {
        acc[stage] = [];
        return acc;
      }, {} as OrdersByStage);

      // Group orders by stage
      (data || []).forEach((order) => {
        // Handle legacy stages or invalid stages by putting them in first stage or ignoring
        // For now, we just check if key exists
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
      console.error('[moveOrderStage] Fetch error:', fetchError.message, fetchError.details);
      throw fetchError;
    }

    const fromStage = currentOrder.current_stage;

    // 2. Update Order Stage (CRITICAL - must succeed)
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
      console.error('[moveOrderStage] Update error:', updateError.message, updateError.details);
      throw updateError;
    }

    // 3. Create Order Event (best-effort - don't fail if this fails)
    try {
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
        console.error('[moveOrderStage] Failed to create order event (non-critical):', eventError.message, eventError.details);
      }
    } catch (eventError) {
      console.error('[moveOrderStage] Failed to create order event (non-critical):', eventError);
    }

    // 4. Emit Webhook (best-effort)
    webhooksService.emit(
      WEBHOOK_EVENTS.ORDER_STAGE_CHANGED,
      {
        order_id: orderId,
        from_stage: fromStage,
        to_stage: toStage,
      },
      'pipeline'
    ).catch(err => console.error('[moveOrderStage] Webhook failed:', err));

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