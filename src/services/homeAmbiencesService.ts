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
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService.listActiveAmbiences]', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService.listActiveAmbiences]', error);
      return [];
    }
  },
};