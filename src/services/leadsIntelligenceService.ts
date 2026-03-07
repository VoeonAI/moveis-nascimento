import { supabase } from '@/core/supabaseClient';

export interface HotLead {
  id: string;
  name: string;
  phone: string | null;
  last_activity_at: string;
}

export interface StagnantLead {
  id: string;
  name: string;
  phone: string | null;
  last_activity_at: string;
  days_inactive: number;
}

export interface FollowUpLead {
  id: string;
  name: string;
  phone: string | null;
  follow_up_at: string;
  is_overdue: boolean;
}

export interface LeadsRadar {
  hotLeads: HotLead[];
  hotLeadsCount: number;
  stagnantLeads: StagnantLead[];
  stagnantLeadsCount: number;
  followUpLeads: FollowUpLead[];
  followUpLeadsCount: number;
}

export const leadsIntelligenceService = {
  async getLeadsRadar(): Promise<LeadsRadar> {
    try {
      // Calculate dates
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Leads Quentes (últimos 7 dias)
      const { data: hotLeads, error: hotLeadsError } = await supabase
        .from('leads')
        .select('id, name, phone, last_activity_at')
        .gte('last_activity_at', sevenDaysAgo.toISOString())
        .eq('archived', false)
        .order('last_activity_at', { ascending: false })
        .limit(5);

      if (hotLeadsError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] hot leads:', hotLeadsError.message);
      }

      // Get total count of hot leads
      const { count: hotLeadsCount, error: hotLeadsCountError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity_at', sevenDaysAgo.toISOString())
        .eq('archived', false);

      if (hotLeadsCountError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] hot leads count:', hotLeadsCountError.message);
      }

      // 2. Leads Parados (sem atividade há 30+ dias)
      const { data: stagnantLeads, error: stagnantLeadsError } = await supabase
        .from('leads')
        .select('id, name, phone, last_activity_at')
        .lte('last_activity_at', thirtyDaysAgo.toISOString())
        .eq('archived', false)
        .order('last_activity_at', { ascending: true })
        .limit(5);

      if (stagnantLeadsError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] stagnant leads:', stagnantLeadsError.message);
      }

      // Get total count of stagnant leads
      const { count: stagnantLeadsCount, error: stagnantLeadsCountError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .lte('last_activity_at', thirtyDaysAgo.toISOString())
        .eq('archived', false);

      if (stagnantLeadsCountError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] stagnant leads count:', stagnantLeadsCountError.message);
      }

      // Calculate days inactive for each stagnant lead
      const stagnantLeadsWithDays = (stagnantLeads || []).map(lead => {
        const lastActivity = new Date(lead.last_activity_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...lead,
          days_inactive: diffDays,
        };
      });

      // 3. Follow-ups Hoje (ou atrasados)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: followUpLeads, error: followUpLeadsError } = await supabase
        .from('leads')
        .select('id, name, phone, follow_up_at')
        .eq('follow_up_needed', true)
        .eq('archived', false)
        .lte('follow_up_at', tomorrow.toISOString())
        .order('follow_up_at', { ascending: true })
        .limit(5);

      if (followUpLeadsError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] follow-up leads:', followUpLeadsError.message);
      }

      // Get total count of follow-up leads
      const { count: followUpLeadsCount, error: followUpLeadsCountError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('follow_up_needed', true)
        .eq('archived', false)
        .lte('follow_up_at', tomorrow.toISOString());

      if (followUpLeadsCountError) {
        console.error('[leadsIntelligenceService.getLeadsRadar] follow-up leads count:', followUpLeadsCountError.message);
      }

      // Mark overdue follow-ups
      const now = new Date();
      const followUpLeadsWithOverdue = (followUpLeads || []).map(lead => ({
        ...lead,
        is_overdue: new Date(lead.follow_up_at) < now,
      }));

      return {
        hotLeads: hotLeads || [],
        hotLeadsCount: hotLeadsCount || 0,
        stagnantLeads: stagnantLeadsWithDays,
        stagnantLeadsCount: stagnantLeadsCount || 0,
        followUpLeads: followUpLeadsWithOverdue,
        followUpLeadsCount: followUpLeadsCount || 0,
      };
    } catch (error) {
      console.error('[leadsIntelligenceService.getLeadsRadar]', error);
      return {
        hotLeads: [],
        hotLeadsCount: 0,
        stagnantLeads: [],
        stagnantLeadsCount: 0,
        followUpLeads: [],
        followUpLeadsCount: 0,
      };
    }
  },
};