import { supabase } from '@/core/supabaseClient';
import { Installer } from '@/types/installers';

export const installerService = {
  async getActiveInstallers(): Promise<Installer[]> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[installerService] erro:', error);
      return [];
    }

    return data || [];
  },

  async createInstaller(payload: {
    name: string;
    phone: string;
    city?: string;
  }): Promise<Installer> {
    const { data, error } = await supabase
      .from('installers')
      .insert({
        ...payload,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[installerService] erro ao criar:', error);
      throw error;
    }

    return data;
  },
};