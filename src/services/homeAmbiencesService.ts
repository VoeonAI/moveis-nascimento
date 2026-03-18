import { supabase } from '@/core/supabaseClient';

export interface HomeAmbience {
  id: string;
  title: string;
  category_slug: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const homeAmbiencesService = {
  async listActiveAmbiences(): Promise<HomeAmbience[]> {
    try {
      console.log('[homeAmbiencesService] Iniciando query...');
      
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService] Erro na query:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      console.log('[homeAmbiencesService] Query retornou:', {
        count: data?.length || 0,
        hasData: !!data && data.length > 0,
        firstItem: data?.[0] || null,
      });

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService] Erro inesperado:', error);
      return [];
    }
  },

  async listAllAmbiences(): Promise<HomeAmbience[]> {
    try {
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService.listAllAmbiences] Erro:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService.listAllAmbiences] Erro inesperado:', error);
      return [];
    }
  },

  async updateAmbience(id: string, updates: Partial<HomeAmbience>): Promise<HomeAmbience> {
    try {
      const { data, error } = await supabase
        .from('home_ambiences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[homeAmbiencesService.updateAmbience] Erro:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[homeAmbiencesService.updateAmbience] Erro inesperado:', error);
      throw error;
    }
  },
};