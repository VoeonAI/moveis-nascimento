import { supabase } from '@/core/supabaseClient';
import { Profile } from '@/types';
import { Role } from '@/constants/domain';

export interface UserProfile extends Profile {}

export const usersService = {
  async listProfiles(): Promise<UserProfile[]> {
    try {
      // Note: We can only access profiles from public schema
      // We cannot access auth.users.email directly from client
      // So we rely on the profiles table structure.
      // Assuming profiles table might not have email, we handle it.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[usersService.listProfiles]', error);
      return [];
    }
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    must_change_password?: boolean;
  }): Promise<{ user_id: string; email: string }> {
    const { data: responseData, error } = await supabase.functions.invoke('admin_create_user', {
      body: data,
    });

    if (error) {
      console.error('[usersService.createUser]', error);
      throw new Error(error.message || 'Failed to create user');
    }

    if (!responseData?.ok) {
      console.error('[usersService.createUser]', responseData.error);
      throw new Error(responseData.error || 'Failed to create user');
    }

    return {
      user_id: responseData.user_id,
      email: responseData.email,
    };
  },

  async updateProfileFlags(
    userId: string,
    updates: Partial<{ is_active: boolean; must_change_password: boolean }>
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[usersService.updateProfileFlags]', error);
      throw error;
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