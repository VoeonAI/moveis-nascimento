import { supabase } from '@/core/supabaseClient';

export interface AiInformative {
  id: string;
  title: string | null;
  content: string;
  type: string;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAiInformativeInput {
  title?: string;
  content: string;
  type?: string;
  starts_at?: string;
  ends_at?: string;
  active?: boolean;
}

export interface UpdateAiInformativeInput {
  title?: string;
  content?: string;
  type?: string;
  starts_at?: string;
  ends_at?: string;
  active?: boolean;
}

export const aiInformativesService = {
  /**
   * List all informatives (for admin panel)
   */
  async listAll(): Promise<AiInformative[]> {
    const { data, error } = await supabase
      .from('ai_informatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[aiInformativesService] Error listing informatives:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * List only active and applicable informatives (for AI agent)
   * - active = true
   * - starts_at is null or starts_at <= NOW()
   * - ends_at is null or ends_at >= NOW()
   */
  async listActive(): Promise<AiInformative[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('ai_informatives')
      .select('*')
      .eq('active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[aiInformativesService] Error listing active informatives:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get informative status for display in admin panel
   */
  getStatus(informative: AiInformative): 'active' | 'scheduled' | 'expired' | 'inactive' {
    if (!informative.active) return 'inactive';

    const now = new Date();
    const startsAt = informative.starts_at ? new Date(informative.starts_at) : null;
    const endsAt = informative.ends_at ? new Date(informative.ends_at) : null;

    if (endsAt && endsAt < now) return 'expired';
    if (startsAt && startsAt > now) return 'scheduled';
    return 'active';
  },

  /**
   * Create new informative
   */
  async create(input: CreateAiInformativeInput): Promise<AiInformative> {
    const { data, error } = await supabase
      .from('ai_informatives')
      .insert({
        title: input.title || null,
        content: input.content,
        type: input.type || 'notice',
        starts_at: input.starts_at || null,
        ends_at: input.ends_at || null,
        active: input.active !== undefined ? input.active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('[aiInformativesService] Error creating informative:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update existing informative
   */
  async update(id: string, input: UpdateAiInformativeInput): Promise<AiInformative> {
    const { data, error } = await supabase
      .from('ai_informatives')
      .update({
        ...(input.title !== undefined && { title: input.title || null }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.starts_at !== undefined && { starts_at: input.starts_at || null }),
        ...(input.ends_at !== undefined && { ends_at: input.ends_at || null }),
        ...(input.active !== undefined && { active: input.active }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[aiInformativesService] Error updating informative:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete informative
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_informatives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[aiInformativesService] Error deleting informative:', error);
      throw error;
    }
  },

  /**
   * Get single informative by ID
   */
  async getById(id: string): Promise<AiInformative | null> {
    const { data, error } = await supabase
      .from('ai_informatives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[aiInformativesService] Error getting informative:', error);
      throw error;
    }

    return data;
  },
};