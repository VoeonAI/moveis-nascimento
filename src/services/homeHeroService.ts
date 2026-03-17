import { supabase } from '@/core/supabaseClient';

export interface HomeHero {
  id: string;
  title: string | null;
  highlight_word: string | null;
  image_url: string | null;
  image_alt: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const homeHeroService = {
  async getHomeHero(): Promise<HomeHero | null> {
    const { data, error } = await supabase
      .from('home_hero')
      .select('id, title, highlight_word, image_url')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
  },

  async upsertHomeHero(payload: {
    title?: string;
    highlight_word?: string;
    image_url?: string;
    image_alt?: string;
  }): Promise<HomeHero> {
    try {
      // Check if there's an existing active hero
      const { data: existingHero } = await supabase
        .from('home_hero')
        .select('id')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingHero) {
        // Update existing hero
        const { data, error } = await supabase
          .from('home_hero')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingHero.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new hero
        const { data, error } = await supabase
          .from('home_hero')
          .insert({
            ...payload,
            active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('[homeHeroService.upsertHomeHero]', error);
      throw error;
    }
  },
};