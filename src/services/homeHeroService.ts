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
      .select('id, title, highlight_word, image_url, image_alt, active, created_at, updated_at')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[homeHeroService] hero ativo retornado:', data);
    console.log('[homeHeroService] erro:', error);

    if (error) {
      console.error('[homeHeroService] getHomeHero error:', error);
      throw error;
    }

    return data ?? null;
  },

  async upsertHomeHero(payload: HomeHero): Promise<HomeHero> {
    // 1. desativa todos
    await supabase
      .from('home_hero')
      .update({ active: false })
      .eq('active', true);

    // 2. insere novo hero
    const { data, error } = await supabase
      .from('home_hero')
      .insert({
        title: payload.title,
        highlight_word: payload.highlight_word,
        image_url: payload.image_url,
        image_alt: payload.image_alt,
        active: true,
      })
      .select();

    if (error) {
      console.error('[homeHeroService] insert error:', error);
      throw error;
    }

    return data?.[0];
  },
};