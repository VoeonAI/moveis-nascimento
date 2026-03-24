import { supabase } from '@/integrations/supabase/client';

export type Installer = {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  photo_alt: string | null;
  city: string | null;
  bio: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export const installersService = {
  async getInstallers(): Promise<Installer[]> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[installersService] getInstallers error:', error);
      throw error;
    }

    return (data ?? []) as Installer[];
  },

  async getActiveInstallers(): Promise<Installer[]> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[installersService] getActiveInstallers error:', error);
      throw error;
    }

    return (data ?? []) as Installer[];
  },
};