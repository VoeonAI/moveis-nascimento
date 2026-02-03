import { supabase } from '@/core/supabaseClient';
import { Lead, Opportunity } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { webhooksService } from './webhooksService';

// Extended interface for internal use with product data
export interface OpportunityWithProduct extends Opportunity {
  product_name?: string;
}

// Timeline event types
export type TimelineEventType = 
  | 'note'
  | 'opportunity_created'
  | 'opportunity_stage_changed'
  | 'followup_set'
  | 'lead_created';

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
  async listLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[crmService.listLeads]', error);
      return [];
    }
  },

  async getLeadWithOpportunities(leadId: string): Promise<{ lead: Lead; opportunities: OpportunityWithProduct[] }> {
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
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      // Transform to include product_name
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

  async updateOpportunityStage(
    opportunityId: string,
    newStage: OpportunityStage,
    leadId: string
  ): Promise<Opportunity> {
    // 1. Get current stage
    const { data: currentOpp } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('id', opportunityId)
      .single();

    if (!currentOpp) throw new Error('Opportunity not found');

    const fromStage = currentOpp.stage;

    // 2. Update stage
    const { data, error } = await supabase
      .from('opportunities')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;

    // 3. Create timeline event
    await this._addTimelineEvent(leadId, 'opportunity_stage_changed', null, {
      opportunity_id: opportunityId,
      from: fromStage,
      to: newStage,
    });

    // 4. Update lead activity
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

    // Update last_activity_at
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

    // Create timeline event
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

    // Note: Timeline creation is handled by the edge function for this specific flow
    // to ensure atomicity with the product context

    await webhooksService.emit('lead.created_from_interest', {
      lead,
      opportunity,
    });

    return lead;
  },

  // Internal helpers
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