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

const BUCKET = 'home-assets';

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

  async createHomeAmbience(): Promise<HomeAmbience> {
    console.log('[homeAmbiencesService.createHomeAmbience] Iniciando criação');

    try {
      // Buscar maior sort_order atual
      const { data: existing } = await supabase
        .from('home_ambiences')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

      console.log('[homeAmbiencesService.createHomeAmbience] Próximo sort_order:', nextSortOrder);

      // Inserir novo ambiente
      const { data, error } = await supabase
        .from('home_ambiences')
        .insert({
          title: 'Novo ambiente',
          category_slug: 'novo',
          image_url: '',
          active: true,
          sort_order: nextSortOrder,
        })
        .select();

      console.log('[homeAmbiencesService.createHomeAmbience] Resultado:', {
        hasError: !!error,
        hasData: !!data,
        dataLength: data?.length,
        firstItem: data?.[0],
      });

      if (error) {
        console.error('[homeAmbiencesService.createHomeAmbience] Erro:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[homeAmbiencesService.createHomeAmbience] Nenhum registro retornado');
        throw new Error('Falha ao criar ambiente');
      }

      const created = data[0];
      console.log('[homeAmbiencesService.createHomeAmbience] Ambiente criado com sucesso:', created);

      return created;
    } catch (error) {
      console.error('[homeAmbiencesService.createHomeAmbience] Erro inesperado:', error);
      throw error;
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

  async deleteHomeAmbience(id: string, imageUrl: string | null): Promise<void> {
    console.log('[homeAmbiencesService.deleteHomeAmbience] Iniciando exclusão:', { id, hasImage: !!imageUrl });

    try {
      // 1. Se tiver imageUrl e for do bucket home-assets, tentar apagar do storage
      if (imageUrl && imageUrl.includes('home-assets')) {
        // Converter URL pública em path interno
        const path = imageUrl.replace(
          'https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/home-assets/',
          ''
        );
        
        console.log('[homeAmbiencesService] Tentando remover imagem do storage:', path);

        // Remover arquivo do storage
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([path]);

        if (storageError) {
          console.error('[homeAmbiencesService] Erro ao remover imagem do storage:', storageError);
          throw new Error('Erro ao remover imagem do storage');
        }

        console.log('[homeAmbiencesService] Imagem removida com sucesso');
      }

      // 2. Excluir registro do banco
      console.log('[homeAmbiencesService] Excluindo registro do banco:', id);
      const { error: dbError } = await supabase
        .from('home_ambiences')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('[homeAmbiencesService] Erro ao excluir registro:', dbError);
        throw new Error('Erro ao excluir ambiente');
      }

      console.log('[homeAmbiencesService] Ambiente excluído com sucesso');
    } catch (error) {
      console.error('[homeAmbiencesService] deleteHomeAmbience error:', error);
      throw error;
    }
  },
};