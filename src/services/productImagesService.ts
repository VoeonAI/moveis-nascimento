import { supabase } from '@/core/supabaseClient';

const BUCKET = 'product-images';

export function getProductImageUrl(path: string): string {
  if (!path) return '';
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImages(productId: string, files: File[]) {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/\s+/g, '-');
    const storagePath = `product-images/${Date.now()}-${safeName}`;

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