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

  // PATCH: Adicionar join com products
  async listOpportunitiesByLead(leadId: string): Promise<(Opportunity & { products?: { id: string; name: string } })[]> {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, lead_id, product_id, stage, created_at, products (id, name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[crmService.listOpportunitiesByLead]', error.message);
      throw error;
    }
    return data ?? [];
  },

  async getLeadDetail(leadId: string): Promise<{ lead: Lead; opportunities: (Opportunity & { products?: { id: string; name: string } })[]; timeline: TimelineEvent[] }> {
    // 1. Lead (Obrigatório)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) {
      console.error('[crmService.getLeadDetail] Lead fetch error:', leadError.message);
      throw leadError;
    }

    // 2. Opportunities (Opcional - não trava se falhar)
    let opportunities: (Opportunity & { products?: { id: string; name: string } })[] = [];
    try {
      opportunities = await this.listOpportunitiesByLead(leadId);
    } catch (err) {
      console.error('[crmService.getLeadDetail] Opportunities fetch error:', err);
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
    // Mantido para compatibilidade
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
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id')
      .eq('lead_id', leadId)
      .eq('archived', false);

    if (opportunities && opportunities.length > 0) {
      throw new Error('Não é possível excluir lead com oportunidades ativas. Arquive primeiro.');
    }

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
      .select('stage, product_id')
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

    // Emit opportunity.stage_changed webhook (best-effort)
    webhooksService.emit('opportunity.stage_changed', {
      opportunity_id: opportunityId,
      lead_id,
      product_id: currentOpp.product_id,
      from_stage: fromStage,
      to_stage: newStage,
    }, 'crm').catch(err => console.error('[updateOpportunityStage] Webhook failed:', err));

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

  async setFollowUp(leadId: string, needed: boolean, at?: Date | string): Promise<void> {
    let isoDate: string | null = null;

    if (needed && at) {
      if (at instanceof Date) {
        isoDate = at.toISOString();
      } else if (typeof at === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(at)) {
          isoDate = `${at}T00:00:00.000Z`;
        } else {
          const parsedDate = new Date(at);
          if (!isNaN(parsedDate.getTime())) {
            isoDate = parsedDate.toISOString();
          }
        }
      }
    }

    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_needed: needed,
        follow_up_at: isoDate,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      console.error('[crmService.setFollowUp]', error.message, error.details);
      throw error;
    }

    if (needed) {
      await this._addTimelineEvent(leadId, 'followup_set', null, {
        follow_up_at: isoDate,
      });
    }
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

    // Emit webhooks (best-effort)
    webhooksService.emit('lead.created', {
      lead,
      opportunity,
    }, 'site').catch(err => console.error('[createLeadFromInterest] Webhook failed:', err));

    webhooksService.emit('opportunity.created', {
      opportunity,
      lead,
    }, 'site').catch(err => console.error('[createLeadFromInterest] Webhook failed:', err));

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