import { supabase } from '@/core/supabaseClient';
import { Lead, Opportunity } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { webhooksService } from './webhooksService';

export interface OpportunityWithProduct extends Opportunity {
  product_name?: string;
}

export type TimelineEventType = 
  | 'note'
  | 'opportunity_created'
  | 'opportunity_stage_changed'
  | 'followup_set'
  | 'lead_created'
  | 'lead_archived'
  | 'lead_restored'
  | 'opportunity_archived'
  | 'opportunity_restored';

export interface TimelineEvent {
  id: string;
  lead_id: string;
  type: TimelineEventType;
  message: string | null;
  meta: any;
  created_by: string | null;
  created_at: string;
}

export const crmService = {
  async listLeads(includeArchived: boolean = false): Promise<Lead[]> {
    try {
      // PATCH: Query simplificada para compatibilidade com schema atual
      // Evita filtrar por colunas que podem não existir (archived, last_activity_at)
      // Usa created_at para ordenação
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[crmService.listLeads] Supabase error:', error.message, error.details);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('[crmService.listLeads] Unexpected error:', error.message, error);
      throw error;
    }
  },

  // NOVO: getLeadDetail com isolamento de erros
  async getLeadDetail(leadId: string): Promise<{ lead: Lead; opportunities: OpportunityWithProduct[]; timeline: TimelineEvent[] }> {
    // 1. Lead (Obrigatório)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) {
      console.error('[crmService.getLeadDetail] Lead fetch error:', leadError.message);
      throw leadError; // Se lead falha, falha fatal
    }

    // 2. Opportunities (Opcional - não trava se falhar)
    let opportunities: OpportunityWithProduct[] = [];
    try {
      const { data: opps, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          products (name)
        `)
        .eq('lead_id', leadId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (oppError) {
        console.error('[crmService.getLeadDetail] Opportunities fetch error:', oppError.message);
      } else if (opps) {
        opportunities = opps.map((opp: any) => ({
          ...opp,
          product_name: opp.products?.name,
        }));
      }
    } catch (err) {
      console.error('[crmService.getLeadDetail] Opportunities unexpected error:', err);
    }

    // 3. Timeline (Opcional - não trava se falhar)
    let timeline: TimelineEvent[] = [];
    try {
      const { data: events, error: timelineError } = await supabase
        .from('lead_timeline')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (timelineError) {
        console.error('[crmService.getLeadDetail] Timeline fetch error:', timelineError.message);
      } else if (events) {
        timeline = events;
      }
    } catch (err) {
      console.error('[crmService.getLeadDetail] Timeline unexpected error:', err);
    }

    return { lead, opportunities, timeline };
  },

  async getLeadWithOpportunities(leadId: string): Promise<{ lead: Lead; opportunities: OpportunityWithProduct[] }> {
    // Mantido para compatibilidade, mas recomenda-se usar getLeadDetail
    try {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          products (name)
        `)
        .eq('lead_id', leadId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      const opportunitiesWithProduct = (opportunities || []).map((opp: any) => ({
        ...opp,
        product_name: opp.products?.name,
      }));

      return { lead, opportunities: opportunitiesWithProduct };
    } catch (error) {
      console.error('[crmService.getLeadWithOpportunities]', error);
      throw error;
    }
  },

  async archiveLead(leadId: string, archived: boolean, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ archived })
      .eq('id', leadId);

    if (error) throw error;

    await this._addTimelineEvent(
      leadId,
      archived ? 'lead_archived' : 'lead_restored',
      archived ? 'Lead arquivado' : 'Lead restaurado',
      {},
      userId
    );
  },

  async deleteLead(leadId: string): Promise<void> {
    // Check for existing opportunities
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id')
      .eq('lead_id', leadId)
      .eq('archived', false);

    if (opportunities && opportunities.length > 0) {
      throw new Error('Não é possível excluir lead com oportunidades ativas. Arquive primeiro.');
    }

    // Check for existing orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('lead_id', leadId);

    if (orders && orders.length > 0) {
      throw new Error('Não é possível excluir lead com pedidos vinculados. Arquive primeiro.');
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  },

  async archiveOpportunity(opportunityId: string, archived: boolean, leadId: string, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('opportunities')
      .update({ archived })
      .eq('id', opportunityId);

    if (error) throw error;

    await this._addTimelineEvent(
      leadId,
      archived ? 'opportunity_archived' : 'opportunity_restored',
      archived ? 'Oportunidade arquivada' : 'Oportunidade restaurada',
      { opportunity_id: opportunityId },
      userId
    );
  },

  async deleteOpportunity(opportunityId: string): Promise<void> {
    // Check for existing orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('opportunity_id', opportunityId);

    if (orders && orders.length > 0) {
      throw new Error('Não é possível excluir oportunidade com pedido vinculado. Arquive primeiro.');
    }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', opportunityId);

    if (error) throw error;
  },

  async updateOpportunityStage(
    opportunityId: string,
    newStage: OpportunityStage,
    leadId: string
  ): Promise<Opportunity> {
    const { data: currentOpp } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('id', opportunityId)
      .single();

    if (!currentOpp) throw new Error('Opportunity not found');

    const fromStage = currentOpp.stage;

    const { data, error } = await supabase
      .from('opportunities')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;

    await this._addTimelineEvent(leadId, 'opportunity_stage_changed', null, {
      opportunity_id: opportunityId,
      from: fromStage,
      to: newStage,
    });

    await this._updateLeadActivity(leadId);

    return data;
  },

  async addLeadNote(leadId: string, message: string, userId: string): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('lead_timeline')
      .insert({
        lead_id: leadId,
        type: 'note',
        message,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this._updateLeadActivity(leadId);

    return data;
  },

  async listLeadTimeline(leadId: string): Promise<TimelineEvent[]> {
    try {
      const { data, error } = await supabase
        .from('lead_timeline')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[crmService.listLeadTimeline]', error);
      return [];
    }
  },

  async setFollowUp(leadId: string, needed: boolean, at?: Date, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_needed: needed,
        follow_up_at: at ? at.toISOString() : null,
      })
      .eq('id', leadId);

    if (error) throw error;

    if (needed) {
      await this._addTimelineEvent(leadId, 'followup_set', null, {
        follow_up_at: at?.toISOString(),
      }, userId);
    }

    await this._updateLeadActivity(leadId);
  },

  async markLeadAsSeen(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ unread_interest_count: 0 })
      .eq('id', leadId);

    if (error) console.error('[crmService.markLeadAsSeen]', error);
  },

  async createLeadFromInterest(
    leadData: Omit<Lead, 'id' | 'created_at'>
  ): Promise<Lead> {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) throw leadError;

    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        lead_id: lead.id,
        stage: OpportunityStage.TALKING_AI,
        estimated_value: 0,
      })
      .select()
      .single();

    if (oppError) throw oppError;

    await webhooksService.emit('lead.created_from_interest', {
      lead,
      opportunity,
    });

    return lead;
  },

  async _addTimelineEvent(
    leadId: string,
    type: TimelineEventType,
    message: string | null,
    meta: any,
    created_by?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('lead_timeline')
      .insert({
        lead_id: leadId,
        type,
        message,
        meta,
        created_by,
      });

    if (error) console.error('[crmService._addTimelineEvent]', error);
  },

  async _updateLeadActivity(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) console.error('[crmService._updateLeadActivity]', error);
  },
};