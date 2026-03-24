import { supabase } from "@/core/supabase/client";

export interface Installer {
  id: string;
  name: string;
  phone: string;
  city?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const installersService = {
  async getInstallers(): Promise<Installer[]> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[installersService] getInstallers error', error);
      throw error;
    }

    return data || [];
  },

  async getActiveInstallers(): Promise<Installer[]> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[installersService] getActiveInstallers error', error);
      throw error;
    }

    return data || [];
  },
};