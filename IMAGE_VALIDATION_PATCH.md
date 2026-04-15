# PATCH CIRÚRGICO — PARAR DE CONSIDERAR IMAGENS QUEBRADAS COMO VÁLIDAS

## OBJETIVO
Corrigir a galeria do ProductDetail e a ferramenta `/diagnostic-images` para não tratar imagens quebradas antigas como válidas.

## DATA
2025-01-17

## PROBLEMAS IDENTIFICADOS

### 1. **Ferramenta /diagnostic-images considerava erro de rede como único critério**
```typescript
// ❌ ANTES
const response = await fetch(resolvedUrl, { method: 'HEAD', mode: 'no-cors' });
// Com no-cors, status 404/403/400 também não geram erro
// Eles eram considerados "sucesso" porque não houve erro de rede
return { isValid: true, status: 'success' };
```

### 2. **ProductDetail não validava se imagens realmente carregam**
```typescript
// ❌ ANTES
const resolvedCurrentImages = useMemo(() => {
  return currentImages
    .map(img => {
      const resolvedUrl = productImagesService.resolveProductImageUrl(rawPath);
      return {
        rawPath,
        resolvedUrl,
        hasValidUrl: !!resolvedUrl && resolvedUrl !== rawPath
      };
    })
    .filter(img => img.hasValidUrl); // Apenas verifica se URL foi resolvida
});
// NÃO verifica se a imagem realmente carrega (HTTP 200)
```

### 3. **Imagens legadas quebradas poluíam a galeria**
- Imagens antigas que retornam 404/403 eram consideradas válidas
- Thumbnails quebradas apareciam na galeria
- Troca de cor podia mostrar imagens que não carregam

## SOLUÇÃO APLICADA

### 1. **Corrigir ferramenta de diagnóstico — validar HTTP status real**
```typescript
// ✅ DEPOIS
const testImage = async (...) => {
  // Removido mode: 'no-cors' para poder ler o status
  const response = await fetch(resolvedUrl, { method: 'HEAD' });
  
  console.log(`[ImageDiagnosticTool] 📊 HTTP Status: ${response.status}`);
  console.log(`[ImageDiagnosticTool] 📊 response.ok: ${response.ok}`);

  // Considerar sucesso APENAS quando response.ok === true
  // response.ok é true para status 200-299
  const isValid = response.ok === true;

  return {
    isValid,
    status: isValid ? 'success' : 'error',
    httpCode: response.status, // Agora captura o código HTTP real
  };
};
```

**Resultado:**
- ✅ Status 404/403/400 são marcados como erro
- ✅ Status 200-299 são marcados como sucesso
- ✅ UI mostra código HTTP para debug

### 2. **Adicionar estado `validatedImages` no ProductDetail**
```typescript
// ✅ DEPOIS
// Estado para armazenar apenas imagens que passaram na validação
const [validatedImages, setValidatedImages] = useState<Array<{
  rawPath: string;
  resolvedUrl: string;
}>>([]);

const [validatingImages, setValidatingImages] = useState(false);
```

### 3. **Função `checkImageExists` para validar carregamento real**
```typescript
// ✅ DEPOIS
const checkImageExists = async (url: string): Promise<{
  url: string;
  exists: boolean;
  httpStatus?: number
}> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      exists: response.ok === true, // Apenas 200-299
      httpStatus: response.status
    };
  } catch (error) {
    return { url, exists: false };
  }
};
```

### 4. **Effect para validar imagens automaticamente**
```typescript
// ✅ DEPOIS
useEffect(() => {
  const validateImages = async () => {
    if (resolvedCurrentImages.length === 0) {
      setValidatedImages([]);
      setValidatingImages(false);
      return;
    }

    setValidatingImages(true);
    console.log('[ProductDetail] 🔍 Validating images...');

    // Valida todas as imagens em paralelo
    const validations = resolvedCurrentImages.map(img => 
      checkImageExists(img.resolvedUrl)
    );

    const results = await Promise.all(validations);

    // Filtra apenas imagens que realmente carregam
    const validImages = results
      .filter(r => r.exists)
      .map(r => {
        const original = resolvedCurrentImages.find(img => img.resolvedUrl === r.url);
        return original || { rawPath: '', resolvedUrl: r.url };
      });

    const removedImages = results.filter(r => !r.exists);
    
    console.log('[ProductDetail]   → Valid images:', validImages.length);
    console.log('[ProductDetail]   → Removed broken images:', removedImages.length);
    
    removedImages.forEach(img => {
      console.log(`[ProductDetail]   ❌ Removed broken image: ${img.url}`);
      console.log(`[ProductDetail]      HTTP Status: ${img.httpStatus || 'NETWORK_ERROR'}`);
    });

    setValidatedImages(validImages);
    setValidatingImages(false);

    // Reset mainImageOverride se a imagem atual quebrou
    if (mainImageOverride) {
      const stillValid = validImages.some(img => img.resolvedUrl === mainImageOverride);
      if (!stillValid) {
        console.log('[ProductDetail]   🔄 Resetting mainImageOverride (current image is broken)');
        setMainImageOverride(null);
      }
    }
  };

  validateImages();
}, [resolvedCurrentImages]); // Executa sempre que as imagens mudarem
```

### 5. **Atualizar `mainImageUrl` para usar `validatedImages`**
```typescript
// ✅ DEPOIS
const mainImageUrl = useMemo(() => {
  // 1. Se usuário clicou em uma thumbnail específica, usa essa (JÁ VALIDADA)
  if (mainImageOverride) {
    const stillValid = validatedImages.some(img => img.resolvedUrl === mainImageOverride);
    if (stillValid) {
      return mainImageOverride;
    } else {
      console.log('[ProductDetail]   ⚠️ Override is no longer valid, falling back');
      setMainImageOverride(null);
    }
  }
  
  // 2. Se tem is_primary, verifica se está na lista de validadas
  if (hasVariants && selectedVariant) {
    const primaryImage = product.image_variants?.find(/* ... */);
    if (primaryImage?.image_url) {
      const url = productImagesService.resolveProductImageUrl(primaryImage.image_url);
      const isValid = validatedImages.some(img => img.resolvedUrl === url);
      if (isValid) {
        return url;
      } else {
        console.log('[ProductDetail]   ⚠️ is_primary image is broken, skipping');
      }
    }
  }
  
  // 3. Se tem primary_image legado, verifica se está na lista de validadas
  if (selectedVariant?.primary_image) {
    const url = productImagesService.resolveProductImageUrl(selectedVariant.primary_image);
    const isValid = validatedImages.some(img => img.resolvedUrl === url);
    if (isValid) {
      return url;
    } else {
      console.log('[ProductDetail]   ⚠️ primary_image is broken, skipping');
    }
  }
  
  // 4. Usa a PRIMEIRA imagem VALIDADA
  if (validatedImages.length > 0) {
    return validatedImages[0].resolvedUrl;
  }
  
  console.log('[ProductDetail]   ⚠️ No valid image found');
  return '';
}, [hasVariants, selectedVariant, validatedImages, mainImageOverride, product]);
```

### 6. **Atualizar `galleryImages` para usar `validatedImages`**
```typescript
// ✅ DEPOIS
const galleryImages = useMemo(() => {
  return validatedImages.map((img, idx) => ({
    rawPath: img.rawPath,
    resolvedUrl: img.resolvedUrl,
  }));
}, [validatedImages]);
```

### 7. **Adicionar indicador visual de validação**
```typescript
// ✅ DEPOIS
{mainImageUrl ? (
  <img src={mainImageUrl} alt={product.name} />
) : validatingImages ? (
  <div className="...">
    <Loader2 className="animate-spin" />
    <span>Validando imagens...</span>
  </div>
) : (
  <div>Sem imagem disponível</div>
)}
```

### 8. **Logs detalhados de validação**
```typescript
console.log('[ProductDetail] 🔍 Validating images...');
console.log('[ProductDetail]   → Total to validate:', resolvedCurrentImages.length);
console.log('[ProductDetail]   → Valid images:', validImages.length);
console.log('[ProductDetail]   → Removed broken images:', removedImages.length);

removedImages.forEach(img => {
  console.log(`[ProductDetail]   ❌ Removed broken image: ${img.url}`);
  console.log(`[ProductDetail]      HTTP Status: ${img.httpStatus || 'NETWORK_ERROR'}`);
});
```

## REGRAS DE FALLBACK

### Regra Prática
1. **Usar primeiro imagens válidas novas** (product_image_variants)
2. **Ignorar imagens antigas que retornem erro real** (404/403/400)
3. **Se uma variante só tiver imagens inválidas**, usar fallback seguro

### Cascata de Prioridade
```
1. mainImageOverride (se ainda válida)
2. is_primary em product_image_variants (se válida)
3. primary_image legado da variante (se válido)
4. Primeira imagem de validatedImages
5. Placeholder "Sem imagem disponível"
```

## RESULTADO ESPERADO

### Ferramenta de Diagnóstico
- ✅ Passa a refletir a verdade sobre URLs
- ✅ Mostra código HTTP real (200, 404, 403, 500, etc)
- ✅ Distingue erro de rede de erro HTTP
- ✅ Explica claramente o problema detectado

### ProductDetail
- ✅ A galeria para de exibir imagens quebradas
- ✅ Imagens legadas inválidas deixam de poluir a experiência
- ✅ Thumbnails quebradas são removidas automaticamente
- ✅ Troca de cor sempre mostra imagens válidas
- ✅ Indicador visual durante validação
- ✅ Logs detalhados mostrando quais imagens foram removidas e por que

## LOGS ADICIONADOS

### Ferramenta de Diagnóstico
```
[ImageDiagnosticTool] 📊 HTTP Status: 404
[ImageDiagnosticTool] 📊 response.ok: false
[ImageDiagnosticTool] ❌ Invalid HTTP status: 404
[ImageDiagnosticTool]    Image considered BROKEN
```

### ProductDetail
```
[ProductDetail] 🔍 Validating images...
[ProductDetail]   → Total to validate: 5
[ProductDetail]   → Valid images: 3
[ProductDetail]   → Removed broken images: 2
[ProductDetail]   ❌ Removed broken image: https://...
[ProductDetail]      HTTP Status: 404
[ProductDetail]   🔄 Resetting mainImageOverride (current image is broken)
```

### Render do ProductDetail
```
═══════════════════════════════════════════════════
[ProductDetail] 🖼️ RENDER STATE:
[ProductDetail]   currentImages (raw): [...]
[ProductDetail]   resolvedCurrentImages: [...]
[ProductDetail]   validatedImages (final): [...] // Apenas válidas
[ProductDetail]   validatingImages: false
[ProductDetail]   mainImageUrl: https://...
[ProductDetail]   galleryImages: [...]
═══════════════════════════════════════════════════
```

## FLUXO DE VALIDAÇÃO

```
Banco de Dados (paths brutos)
  ↓
currentImages (paths brutos)
  ↓
resolvedCurrentImages (URLs resolvidas)
  ↓
[Validação em Paralelo] checkImageExists() para cada URL
  ├─ HTTP 200-299 → ✅ Incluído em validatedImages
  ├─ HTTP 404/403/400 → ❌ Removido, logged
  └─ Network Error → ❌ Removido, logged
  ↓
validatedImages (apenas URLs que realmente carregam)
  ↓
├─ mainImageUrl (usa primeira de validatedImages)
└─ galleryImages (mapeamento de validatedImages)
  ↓
Renderização (todos os src usam URLs validadas)
```

## REGRAS DO PATCH

1. ✅ NÃO alterar banco estruturalmente
2. ✅ NÃO reescrever ProductDetail inteiro
3. ✅ NÃO mexer no CRM
4. ✅ Foco em validação real de imagem
5. ✅ Exclusão lógica de imagens inválidas
6. ✅ Manter logs temporários

## ARQUIVOS ALTERADOS

- `src/pages/ImageDiagnosticTool.tsx` ✅
  - Removido `mode: 'no-cors'` no fetch
  - Captura de código HTTP real
  - UI mostra código HTTP e explica erro

- `src/pages/ProductDetail.tsx` ✅
  - Adicionado estado `validatedImages`
  - Adicionado estado `validatingImages`
  - Função `checkImageExists` para validação real
  - `useEffect` para validar imagens automaticamente
  - `mainImageUrl` usa `validatedImages`
  - `galleryImages` usa `validatedImages`
  - Indicador visual durante validação
  - Logs detalhados de imagens removidas

## ARQUIVOS NÃO ALTERADOS

- Banco de dados ❌
- Helper `resolveProductImageUrl` ❌
- CRM ❌
- Outros componentes ❌

## TESTE MANUAL

### Testar Ferramenta de Diagnóstico
1. Acesse `/diagnostic-images`
2. Clique em "Testar Todas as Imagens"
3. Verifique se códigos HTTP aparecem
4. Abra imagens em nova aba para confirmar
5. Verifique console para logs detalhados

### Testar ProductDetail
1. Acesse uma página de produto
2. Observe "Validando imagens..." indicador
3. Verifique console para logs de validação
4. Confirme que imagens quebradas não aparecem
5. Troque a cor/variante
6. Clique em thumbnails
7. Abra zoom modal

### Verificar Logs
```
✅ Valid images: X
❌ Removed broken images: Y
   → HTTP Status: 404
```

## PRÓXIMOS PASSOS

Se ainda houver imagens quebradas:
1. Usar ferramenta `/diagnostic-images` para identificar
2. Verificar códigos HTTP retornados
3. Atualizar banco de dados conforme necessário
4. Remover imagens obsoletas ou corrigir paths

## DIFERENÇAS ENTRE OS DOIS PATCHES

### Patch 1 (PRODUCTDETAIL_RESOLVED_URLS_PATCH.md)
- Garante que URLs resolvidas são usadas no `src`
- Elimina uso de paths brutos no render
- Foco: Resolução de URLs

### Patch 2 (IMAGE_VALIDATION_PATCH.md)
- Valida se imagens realmente carregam (HTTP 200-299)
- Remove imagens quebradas da galeria
- Foco: Validação de carregamento

**Ambos trabalham juntos:**
1. Patch 1 resolve os paths para URLs
2. Patch 2 valida se as URLs realmente carregam
3. Apenas URLs resolvidas E validadas aparecem na galeria
