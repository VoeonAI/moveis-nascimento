import { supabase } from '@/core/supabaseClient';

export interface HomePromoBanner {
  id: string;
  image_url: string;
  image_alt: string;
  text: string;
  show_text: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const homePromoBannerService = {
  async getPromoBanner(): Promise<HomePromoBanner | null> {
    try {
      const { data, error } = await supabase
        .from('home_promo_banner')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[homePromoBannerService] getPromoBanner error:', error);
        return null;
      }

      return data ?? null;
    } catch (error) {
      console.error('[homePromoBannerService] getPromoBanner unexpected error:', error);
      return null;
    }
  },

  async upsertPromoBanner(payload: Omit<HomePromoBanner, 'id' | 'created_at' | 'updated_at'>): Promise<HomePromoBanner> {
    console.log('[homePromoBannerService] upsertPromoBanner:', payload);

    try {
      // 1. Desativar todos os banners existentes
      const { error: deactivateError } = await supabase
        .from('home_promo_banner')
        .update({ active: false })
        .eq('active', true);

      if (deactivateError) {
        console.error('[homePromoBannerService] deactivate error:', deactivateError);
        throw new Error('Falha ao desativar banners anteriores');
      }

      // 2. Inserir novo banner
      const { data, error } = await supabase
        .from('home_promo_banner')
        .insert({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[homePromoBannerService] insert error:', error);
        throw new Error('Falha ao criar banner promocional');
      }

      if (!data) {
        throw new Error('Falha ao criar banner promocional: nenhum dado retornado');
      }

      console.log('[homePromoBannerService] upsertPromoBanner success:', data);
      return data;
    } catch (error) {
      console.error('[homePromoBannerService] upsertPromoBanner unexpected error:', error);
      throw error;
    }
  },
};