import { supabase } from '@/core/supabaseClient';

export interface AgentToken {
  id: string;
  name: string;
  token_hash: string;
  scopes: string[];
  active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export const agentTokensService = {
  async listTokens(): Promise<AgentToken[]> {
    try {
      const { data, error } = await supabase
        .from('agent_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[agentTokensService.listTokens]', error);
      return [];
    }
  },
};