import { supabase } from '@/core/supabaseClient';

export interface HomeHero {
  id: string;
  title: string;
  highlight_word: string | null;
  image_url: string | null;
  image_alt: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const homeHeroService = {
  /**
   * Busca o registro ativo do Hero
   * Se não houver registro ativo, retorna null
   */
  async getHomeHero(): Promise<HomeHero | null> {
    try {
      const { data, error } = await supabase
        .from('home_hero')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[homeHeroService.getHomeHero] Error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[homeHeroService.getHomeHero] Unexpected error:', error);
      return null;
    }
  },

  /**
   * Cria ou atualiza o registro do Hero (Upsert)
   * Garante que apenas um registro ativo existe
   */
  async upsertHomeHero(data: {
    title: string;
    highlight_word?: string | null;
    image_url?: string | null;
    image_alt?: string | null;
    active?: boolean;
  }): Promise<HomeHero> {
    try {
      // Primeiro, desativar todos os registros existentes
      await supabase
        .from('home_hero')
        .update({ active: false })
        .neq('active', false);

      // Depois, insere o novo registro ativo
      const { data, error } = await supabase
        .from('home_hero')
        .insert({
          title: data.title,
          highlight_word: data.highlight_word || null,
          image_url: data.image_url || null,
          image_alt: data.image_alt || null,
          active: data.active !== undefined ? data.active : true,
        })
        .select()
        .single();

      if (error) {
        console.error('[homeHeroService.upsertHomeHero] Error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[homeHeroService.upsertHomeHero] Unexpected error:', error);
      throw error;
    }
  },
};