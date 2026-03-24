import { supabase } from '@/core/supabaseClient';

export const installerService = {
  async getActiveInstallers() {
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
};