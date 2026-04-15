import { supabase } from '@/core/supabaseClient';

const BUCKET = 'product-images';

/**
 * Helper único para normalizar URLs de imagens do produto.
 * Lida com imagens antigas (legadas) e novas das variações.
 */
export function resolveProductImageUrl(image: string | null | undefined): string {
  // 1. Se valor vazio ou null/undefined -> retornar vazio
  if (image == null) return '';
  
  // 2. Aplicar trim
  const trimmed = image.trim();
  
  // 3. Validar vazio após trim
  if (!trimmed) return '';
  
  // 4. Se for URL completa (http/https) -> retornar como está
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    console.log('[resolveProductImageUrl] Full URL detected:', trimmed);
    return trimmed;
  }
  
  // 5. Log temporário para identificar formatos antigos no banco
  console.log('[resolveProductImageUrl] Legacy path detected:', {
    original: trimmed,
    hasBucketPrefix: trimmed.includes(BUCKET),
    length: trimmed.length
  });
  
  // 6. Normalizar path: remover prefixo do bucket se presente
  // Paths antigos podem vir como "product-images/arquivo.webp" ou apenas "arquivo.webp"
  let normalizedPath = trimmed;
  if (normalizedPath.startsWith(`${BUCKET}/`)) {
    normalizedPath = normalizedPath.replace(`${BUCKET}/`, '');
    console.log('[resolveProductImageUrl] Removed bucket prefix:', {
      original: trimmed,
      normalized: normalizedPath
    });
  }
  
  // 7. Chamar Supabase com o path normalizado
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalizedPath);
  
  if (data?.publicUrl) {
    console.log('[resolveProductImageUrl] Generated public URL:', data.publicUrl);
    return data.publicUrl;
  }
  
  // 8. Fallback seguro
  console.warn('[resolveProductImageUrl] Failed to generate public URL for:', normalizedPath);
  return '';
}

export function getProductImageUrl(path: string): string {
  if (!path) return '';
  
  // If already a full URL, return as-is
  if (typeof path === 'string' && path.startsWith('http')) {
    return path;
  }
  
  // Remove bucket prefix if present (path should be relative to bucket)
  const normalizedPath = path.startsWith(`${BUCKET}/`)
    ? path.replace(`${BUCKET}/`, '')
    : path;
  
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

export function getPublicUrl(pathOrUrl: string | null | undefined): string {
  // 1. Se valor vazio -> retornar ""
  if (pathOrUrl == null) return "";
  
  // 2. Aplicar trim
  const trimmed = pathOrUrl.trim();
  
  // 3. Validar vazio após trim
  if (!trimmed) return "";
  
  // 4. Se for URL completa -> retornar como está
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  
  // 5. Se for path como "product-images/arquivo.webp" -> usar exatamente esse path
  // NÃO remover o prefixo "product-images/" pois faz parte do path válido
  const path = trimmed;
  
  // 6. Chamar Supabase com o path exato
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  
  // 7. Retornar com fallback defensivo
  return data?.publicUrl ?? "";
}

export async function uploadProductImages(productId: string, files: File[]) {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/\s+/g, '-');
    const storagePath = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) throw error;

    uploadedPaths.push(storagePath);
  }

  return uploadedPaths;
}

export async function removeImage(path: string): Promise<void> {
  if (!path) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    console.error('[productImagesService.removeImage]', error);
    // Don't throw - allow deletion to proceed even if storage cleanup fails
  }
}

export const productImagesService = {
  resolveProductImageUrl,
  getProductImageUrl,
  getPublicUrl,
  uploadProductImages,
  removeImage,
};