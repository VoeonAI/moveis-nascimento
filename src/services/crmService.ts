import { supabase } from '@/core/supabaseClient';
import { Lead, Opportunity } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { webhooksService } from './webhooksService';

export const crmService = {
  async createLeadFromInterest(
    leadData: Omit<Lead, 'id' | 'created_at'>
  ): Promise<Lead> {
    // 1. Create Lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) throw leadError;

    // 2. Create Opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        lead_id: lead.id,
        stage: OpportunityStage.TALKING_AI,
        estimated_value: 0, // Will be updated later
      })
      .select()
      .single();

    if (oppError) throw oppError;

    // 3. Emit Webhook
    await webhooksService.emit('lead.created_from_interest', {
      lead,
      opportunity,
    });

    return lead;
  },

  async changeOpportunityStage(
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
};