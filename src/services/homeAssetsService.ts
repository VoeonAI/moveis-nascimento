import { supabase } from '@/core/supabaseClient';

const BUCKET = 'home-assets';

export const homeAssetsService = {
  /**
   * Faz upload de uma imagem para o bucket home-assets/ambiences/
   * @param file Arquivo de imagem
   * @returns URL pública da imagem
   */
  async uploadAmbienceImage(file: File): Promise<string> {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas arquivos de imagem são permitidos');
    }

    // Gerar nome único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `ambiences/${timestamp}-${randomStr}.${extension}`;

    console.log('[homeAssetsService] Iniciando upload:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
    });

    // Upload para o bucket
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('[homeAssetsService] Erro no upload:', error);
      throw new Error(error.message || 'Erro ao fazer upload da imagem');
    }

    // Obter URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error('Erro ao obter URL pública da imagem');
    }

    console.log('[homeAssetsService] Upload concluído:', data.publicUrl);

    return data.publicUrl;
  },

  /**
   * Faz upload de uma imagem para o bucket home-assets/promo/
   * @param file Arquivo de imagem
   * @returns URL pública da imagem
   */
  async uploadPromoImage(file: File): Promise<string> {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas arquivos de imagem são permitidos');
    }

    // Gerar nome único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `promo/${timestamp}-${randomStr}.${extension}`;

    console.log('[homeAssetsService] Iniciando upload promo:', {
      fileName,
      fileType: file.type,
      fileSize: file.size,
    });

    // Upload para o bucket
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('[homeAssetsService] Erro no upload promo:', error);
      throw new Error(error.message || 'Erro ao fazer upload da imagem');
    }

    // Obter URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error('Erro ao obter URL pública da imagem');
    }

    console.log('[homeAssetsService] Upload promo concluído:', data.publicUrl);

    return data.publicUrl;
  },

  /**
   * Obtém URL pública de um arquivo no bucket
   * @param path Caminho do arquivo (ex: ambiences/123456-abc.jpg)
   * @returns URL pública
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || '';
  },
};