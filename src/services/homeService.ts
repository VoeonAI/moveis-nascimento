import { supabase } from '@/core/supabaseClient';

export interface HomeConfig {
  id: string;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_highlight_word: string | null;
  ambiences: Array<{
    id: string;
    title: string;
    category_slug: string;
    image_url: string;
  }>;
  promo_enabled: boolean;
  promo_image_url: string | null;
  promo_text: string | null;
  created_at: string;
  updated_at: string;
}

export const homeService = {
  async getHomeConfig(): Promise<HomeConfig | null> {
    try {
      const { data, error } = await supabase
        .from('home_config')
        .select('*')
        .single();

      if (error) {
        console.error('[homeService.getHomeConfig]', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[homeService.getHomeConfig]', error);
      return null;
    }
  },

  async updateHomeConfig(updates: Partial<Omit<HomeConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<HomeConfig> {
    try {
      const { data, error } = await supabase
        .from('home_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[homeService.updateHomeConfig]', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[homeService.updateHomeConfig]', error);
      throw error;
    }
  },
};