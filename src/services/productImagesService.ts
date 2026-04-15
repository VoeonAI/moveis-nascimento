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

// Extensões de imagem permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_FILENAME_LENGTH = 500;
const MIN_FILENAME_LENGTH = 5;

/**
 * Valida se um path de imagem é válido.
 * Retorna true se válido, false se inválido.
 */
function isValidImagePath(path: string): boolean {
  // 1. Validar tamanho
  if (path.length < MIN_FILENAME_LENGTH) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: too short', { path, length: path.length });
    return false;
  }

  if (path.length > MAX_FILENAME_LENGTH) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: too long', { path, length: path.length });
    return false;
  }

  // 2. Verificar se tem extensão válida
  const lowerPath = path.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerPath.endsWith(ext));

  if (!hasValidExtension) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: no valid extension', {
      path,
      allowedExtensions: ALLOWED_EXTENSIONS
    });
    return false;
  }

  // 3. Detectar padrões suspeitos (strings concatenadas, caracteres especiais excessivos)
  // Exemplo: "file1.jpgfile2.png" ou "produto   .jpg"
  const consecutiveSpaces = /\s{4,}/.test(path);
  const concatenatedExtensions = /\.(jpg|jpeg|png|webp|gif|svg)/gi.test(path.replace(/.*\.(jpg|jpeg|png|webp|gif|svg)/i, ''));

  if (consecutiveSpaces) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: suspicious consecutive spaces', { path });
    return false;
  }

  if (concatenatedExtensions) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: suspicious concatenated extensions', { path });
    return false;
  }

  // 4. Validar caracteres inválidos (não usar /, \, :, *, ?, ", <, >, |)
  // Exceto "/" que pode indicar subpastas válidas
  const invalidChars = /[\\:*?"<>|]/;
  if (invalidChars.test(path)) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: invalid characters', { path });
    return false;
  }

  // 5. Validar que não é apenas whitespace
  if (!path.trim()) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: whitespace only');
    return false;
  }

  return true;
}

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
 * Validações de segurança:
 * - Extensões permitidas: .jpg, .jpeg, .png, .webp, .gif, .svg
 * - Tamanho mínimo: 5 caracteres
 * - Tamanho máximo: 500 caracteres
 * - Padrões suspeitos detectados automaticamente
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
  if (!trimmed) {
    console.warn('[resolveProductImageUrl] ❌ Invalid image path: empty string');
    return '';
  }
  
  // 4. Se for URL completa (http/https) -> retornar como está
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    console.log('[resolveProductImageUrl] Full URL detected:', trimmed);
    return trimmed;
  }
  
  // 5. VALIDAÇÃO DE SEGURANÇA - Validar path antes de tentar resolver
  if (!isValidImagePath(trimmed)) {
    console.error('═══════════════════════════════════════════════════');
    console.error('[resolveProductImageUrl] ❌ INVALID IMAGE PATH DETECTED');
    console.error('[resolveProductImageUrl] Path:', trimmed);
    console.error('[resolveProductImageUrl] Image will NOT be rendered - using placeholder');
    console.error('═══════════════════════════════════════════════════');
    return ''; // Retorna vazio para usar placeholder
  }
  
  // 6. Log detalhado do path original
  console.log('═══════════════════════════════════════════════════');
  console.log('[resolveProductImageUrl] 🔍 DIAGNÓSTICO INICIADO');
  console.log('[resolveProductImageUrl] Original path:', trimmed);
  console.log('[resolveProductImageUrl] Path length:', trimmed.length);
  console.log('[resolveProductImageUrl] Starts with "/" ?', trimmed.startsWith('/'));
  console.log('[resolveProductImageUrl] Contains "product-images"?', trimmed.includes('product-images'));
  console.log('═══════════════════════════════════════════════════');
  
  // 7. Normalizar path: remover "/" inicial e prefixos de bucket
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
  
  // 8. Tentar cada bucket possível
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
  
  // 9. Se tudo falhar, tentar usar o path exatamente como veio do banco
  console.log('[resolveProductImageUrl] ⚠️ Tentando usar path exato do banco (sem normalização):', trimmed);
  for (const bucket of POSSIBLE_BUCKETS) {
    const url = tryGetPublicUrl(bucket, trimmed);
    if (url) return url;
  }
  
  // 10. Fallback seguro
  console.error('═══════════════════════════════════════════════════');
  console.error('[resolveProductImageUrl] ❌ FALHA TOTAL - Nenhum bucket funcionou');
  console.error('[resolveProductImageUrl] Original path:', trimmed);
  console.error('[resolveProductImageUrl] Normalized path:', normalizedPath);
  console.error('[resolveProductImageUrl] Image will NOT be rendered - using placeholder');
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