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

  async toggleInstallerStatus(id: string, active: boolean) {
  const { data, error } = await supabase
    .from('installers')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
},

  async createInstaller(payload: {
    name: string;
    phone: string;
    city?: string;
  }) {
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
