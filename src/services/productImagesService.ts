import { supabase } from '@/core/supabaseClient';

const BUCKET = 'product-images';

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
  getProductImageUrl,
  getPublicUrl,
  uploadProductImages,
  removeImage,
};