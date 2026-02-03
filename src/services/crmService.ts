import { supabase } from '@/core/supabaseClient';
import { Lead, Opportunity } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { webhooksService } from './webhooksService';

export const crmService = {
  async listLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[crmService.listLeads]', error);
      return [];
    }
  },

  async getLeadWithOpportunities(leadId: string): Promise<{ lead: Lead; opportunities: Opportunity[] }> {
    try {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      return { lead, opportunities: opportunities || [] };
    } catch (error) {
      console.error('[crmService.getLeadWithOpportunities]', error);
      throw error;
    }
  },

  async updateOpportunityStage(
    opportunityId: string,
    newStage: OpportunityStage
  ): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('opportunities')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
};