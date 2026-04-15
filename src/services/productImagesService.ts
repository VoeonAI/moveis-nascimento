import { supabase } from '@/core/supabaseClient';

const BUCKET = 'product-images';

// Lista de buckets possíveis para imagens de produtos
// Em ordem de prioridade: bucket principal → buckets legados
const POSSIBLE_BUCKETS = [
  'product-images',      // Bucket principal atual
  'products',             // Possível bucket legado
  'images',               // Possível bucket legado
  'produtos',             // Possível bucket legado (PT-BR)
];

/**
 * Tenta gerar URL pública para um path em um bucket específico.
 * Retorna a URL se sucesso, null se falhar.
 */
function tryGetPublicUrl(bucket: string, path: string): string | null {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) {
      console.log(`[resolveProductImageUrl] ✅ Success with bucket="${bucket}" path="${path}"`);
      console.log(`[resolveProductImageUrl] URL: ${data.publicUrl}`);
      return data.publicUrl;
    }
  } catch (error) {
    console.warn(`[resolveProductImageUrl] ❌ Failed with bucket="${bucket}" path="${path}":`, error);
  }
  return null;
}

/**
 * Helper robusto para normalizar URLs de imagens do produto.
 * Lida com imagens antigas (legadas) e novas das variações.
 * 
 * Diagnóstico detalhado:
 * - Logs todos os paths detectados
 * - Tenta múltiplos buckets
 * - Testa diferentes variações de path
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
  
  // 5. Log detalhado do path original
  console.log('═══════════════════════════════════════════════════');
  console.log('[resolveProductImageUrl] 🔍 DIAGNÓSTICO INICIADO');
  console.log('[resolveProductImageUrl] Original path:', trimmed);
  console.log('[resolveProductImageUrl] Path length:', trimmed.length);
  console.log('[resolveProductImageUrl] Starts with "/" ?', trimmed.startsWith('/'));
  console.log('[resolveProductImageUrl] Contains "product-images"?', trimmed.includes('product-images'));
  console.log('═══════════════════════════════════════════════════');
  
  // 6. Normalizar path: remover "/" inicial e prefixos de bucket
  let normalizedPath = trimmed;
  
  // Remover "/" inicial se existir
  if (normalizedPath.startsWith('/')) {
    console.log('[resolveProductImageUrl] ⚠️ Path começa com "/" - REMOVENDO');
    normalizedPath = normalizedPath.substring(1);
    console.log('[resolveProductImageUrl] Path após remover "/":', normalizedPath);
  }
  
  // Remover prefixo do bucket se presente
  if (normalizedPath.startsWith(`${BUCKET}/`)) {
    console.log('[resolveProductImageUrl] ⚠️ Path contém prefixo do bucket - REMOVENDO');
    normalizedPath = normalizedPath.replace(`${BUCKET}/`, '');
    console.log('[resolveProductImageUrl] Path após remover bucket:', normalizedPath);
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('[resolveProductImageUrl] 🎯 Tentando resolução com path normalizado:', normalizedPath);
  console.log('═══════════════════════════════════════════════════');
  
  // 7. Tentar cada bucket possível
  for (const bucket of POSSIBLE_BUCKETS) {
    console.log(`[resolveProductImageUrl] 📦 Tentando bucket: "${bucket}"`);
    
    // Tentar com path normalizado
    const url1 = tryGetPublicUrl(bucket, normalizedPath);
    if (url1) return url1;
    
    // Se o path original começava com "/", tentar COM "/" também
    if (trimmed.startsWith('/')) {
      const url2 = tryGetPublicUrl(bucket, trimmed);
      if (url2) return url2;
    }
    
    // Se o path original tinha prefixo de bucket, tentar o path original também
    if (trimmed.includes(BUCKET)) {
      const url3 = tryGetPublicUrl(bucket, trimmed);
      if (url3) return url3;
    }
  }
  
  // 8. Se tudo falhar, tentar usar o path exatamente como veio do banco
  console.log('[resolveProductImageUrl] ⚠️ Tentando usar path exato do banco (sem normalização):', trimmed);
  for (const bucket of POSSIBLE_BUCKETS) {
    const url = tryGetPublicUrl(bucket, trimmed);
    if (url) return url;
  }
  
  // 9. Fallback seguro
  console.error('═══════════════════════════════════════════════════');
  console.error('[resolveProductImageUrl] ❌ FALHA TOTAL - Nenhum bucket funcionou');
  console.error('[resolveProductImageUrl] Original path:', trimmed);
  console.error('[resolveProductImageUrl] Normalized path:', normalizedPath);
  console.error('[resolveProductImageUrl] Verifique se:');
  console.error('[resolveProductImageUrl]   1. O arquivo existe no Supabase Storage');
  console.error('[resolveProductImageUrl]   2. O bucket está correto');
  console.error('[resolveProductImageUrl]   3. O nome do arquivo está correto');
  console.error('═══════════════════════════════════════════════════');
  
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