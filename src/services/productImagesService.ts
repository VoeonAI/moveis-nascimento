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
  // 1. Aceitar null/undefined
  if (pathOrUrl == null) return "";
  
  // 2. Aplicar trim
  const trimmed = pathOrUrl.trim();
  
  // 3. Validar vazio após trim
  if (!trimmed) return "";
  
  // 4. Se for URL completa, retornar como está
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  
  // 5. Se começar com "product-images/", remover prefixo
  const normalizedPath = trimmed.startsWith("product-images/")
    ? trimmed.replace(/^product-images\//, "")
    : trimmed;
  
  // 6. Validar novamente se ficou vazio
  if (!normalizedPath) return "";
  
  // 7. Chamar Supabase
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalizedPath);
  
  // 8. Retornar com fallback defensivo
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

export const productImagesService = {
  getProductImageUrl,
  getPublicUrl,
  uploadProductImages,
};