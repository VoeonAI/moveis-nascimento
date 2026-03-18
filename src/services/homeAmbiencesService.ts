import { supabase } from '@/core/supabaseClient';

export interface HomeAmbience {
  id: string;
  title: string;
  category_slug: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const homeAmbiencesService = {
  async listActiveAmbiences(): Promise<HomeAmbience[]> {
    try {
      console.log('[homeAmbiencesService] Iniciando query...');
      
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService] Erro na query:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      console.log('[homeAmbiencesService] Query retornou:', {
        count: data?.length || 0,
        hasData: !!data && data.length > 0,
        firstItem: data?.[0] || null,
      });

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService] Erro inesperado:', error);
      return [];
    }
  },

  async listAllAmbiences(): Promise<HomeAmbience[]> {
    try {
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService.listAllAmbiences] Erro:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService.listAllAmbiences] Erro inesperado:', error);
      return [];
    }
  },

  async updateAmbience(id: string, updates: Partial<HomeAmbience>): Promise<HomeAmbience> {
    console.log('[homeAmbiencesService.updateAmbience] Iniciando update:', { id, updates });

    const { data, error } = await supabase
      .from('home_ambiences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    console.log('[homeAmbiencesService.updateAmbience] Resultado:', {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      hasData: !!data,
      dataLength: data?.length,
      firstItem: data?.[0],
    });

    if (error) {
      console.error('[homeAmbiencesService.updateAmbience] Erro no update:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('[homeAmbiencesService.updateAmbience] Nenhum registro retornado após update');
      throw new Error('Nenhum registro foi atualizado. Verifique as permissões (RLS).');
    }

    const updated = data[0];
    console.log('[homeAmbiencesService.updateAmbience] Registro atualizado com sucesso:', updated);

    return updated;
  },
};
</dy-write>Vou atualizar o `homeAmbiencesService.ts` para adicionar logs detalhados e verificação rigorosa do retorno, garantindo que só seja considerado sucesso se houver confirmação real do banco.

<dyad-write path="src/services/homeAmbiencesService.ts" description="Adicionando logs detalhados e verificação de retorno no updateAmbience">
import { supabase } from '@/core/supabaseClient';

export interface HomeAmbience {
  id: string;
  title: string;
  category_slug: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const homeAmbiencesService = {
  async listActiveAmbiences(): Promise<HomeAmbience[]> {
    try {
      console.log('[homeAmbiencesService] Iniciando query...');
      
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService] Erro na query:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      console.log('[homeAmbiencesService] Query retornou:', {
        count: data?.length || 0,
        hasData: !!data && data.length > 0,
        firstItem: data?.[0] || null,
      });

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService] Erro inesperado:', error);
      return [];
    }
  },

  async listAllAmbiences(): Promise<HomeAmbience[]> {
    try {
      const { data, error } = await supabase
        .from('home_ambiences')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[homeAmbiencesService.listAllAmbiences] Erro:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[homeAmbiencesService.listAllAmbiences] Erro inesperado:', error);
      return [];
    }
  },

  async updateAmbience(id: string, updates: Partial<HomeAmbience>): Promise<HomeAmbience> {
    console.log('[homeAmbiencesService.updateAmbience] INÍCIO UPDATE', {
      id,
      updates,
      timestamp: new Date().toISOString(),
    });

    try {
      const { data, error } = await supabase
        .from('home_ambiences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      console.log('[homeAmbiencesService.updateAmbience] RESULTADO DO UPDATE', {
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        hasData: !!data,
        dataLength: data?.length,
        firstItem: data?.[0],
      });

      if (error) {
        console.error('[homeAmbiencesService.updateAmbience] ERRO NO UPDATE:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[homeAmbiencesService.updateAmbience] NENHUM REGISTRO RETORNADO APÓS UPDATE');
        throw new Error('Nenhum registro foi atualizado. Verifique as permissões (RLS) ou se o ID está correto.');
      }

      const updated = data[0];
      console.log('[homeAmbiencesService.updateAmbience] REGISTRO ATUALIZADO COM SUCESSO:', updated);

      return updated;
    } catch (error) {
      console.error('[homeAmbiencesService.updateAmbience] ERRO INESPERADO:', error);
      throw error;
    }
  },
};