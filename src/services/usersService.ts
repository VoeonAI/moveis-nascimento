import { supabase } from '@/core/supabaseClient';
import { Profile } from '@/types';
import { Role } from '@/constants/domain';

export interface UserProfile extends Profile {
  email?: string;
}

export const usersService = {
  async listAllUsers(): Promise<UserProfile[]> {
    try {
      // Note: We can only access profiles from public schema
      // Auth users are not directly accessible via client
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[usersService.listAllUsers]', error);
      return [];
    }
  },

  async setUserRole(userId: string, role: Role): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin_set_user_role', {
      body: { user_id: userId, role },
    });

    if (error) {
      console.error('[usersService.setUserRole]', error);
      throw new Error(error.message || 'Failed to update user role');
    }

    if (!data?.ok) {
      throw new Error(data?.error || 'Failed to update user role');
    }
  },
};