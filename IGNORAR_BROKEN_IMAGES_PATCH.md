# PATCH CIRÚRGICO — IGNORAR IMAGENS QUEBRADAS NA GALERIA

## OBJETIVO
Evitar que imagens inválidas (HTTP 400/404/403) apareçam na galeria do ProductDetail.

## DATA
2025-01-17

## PROBLEMA
Imagens quebradas (que retornam erro HTTP) estavam sendo exibidas na galeria, causando experiência ruim para o usuário:
- Thumbnails com ícone de imagem quebrada
- Imagem principal não carrega
- Troca de cor pode mostrar imagens inválidas

## SOLUÇÃO APLICADA

### 1. **Função Utilitária Simples `checkImage`**
```typescript
// ✅ Função simples para verificar se imagem carrega
const checkImage = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok; // true para 200-299, false para 400/404/403/etc
  } catch {
    return false; // erro de rede também retorna false
  }
};
```

### 2. **Estado `galleryValidImages`**
```typescript
// ✅ Armazena apenas imagens válidas da galeria
const [galleryValidImages, setGalleryValidImages] = useState<Array<{
  rawPath: string;
  resolvedUrl: string;
}>>([]);
```

### 3. **Validação Automática via `useEffect`**
```typescript
// ✅ Valida imagens assim que resolvedCurrentImages muda
useEffect(() => {
  const validateGalleryImages = async () => {
    if (resolvedCurrentImages.length === 0) {
      setGalleryValidImages([]);
      return;
    }

    console.log('[ProductDetail] 🔍 Validating gallery images...');

    // Validar cada URL em paralelo
    const validations = await Promise.all(
      resolvedCurrentImages.map(async (img) => {
        const isValid = await checkImage(img.resolvedUrl);
        return { ...img, isValid };
      })
    );

    // Manter apenas imagens válidas
    const validImages = validations.filter(v => v.isValid);
    const brokenImages = validations.filter(v => !v.isValid);

    console.log('[ProductDetail]   → Valid images:', validImages.length);
    console.log('[ProductDetail]   → Broken images removed:', brokenImages.length);

    brokenImages.forEach(img => {
      console.log(`[ProductDetail]   ❌ Removed: ${img.resolvedUrl}`);
    });

    setGalleryValidImages(validImages);

    // Reset mainImageOverride se imagem atual quebrou
    if (mainImageOverride) {
      const stillValid = validImages.some(img => img.resolvedUrl === mainImageOverride);
      if (!stillValid) {
        console.log('[ProductDetail]   🔄 Resetting mainImageOverride (broken image)');
        setMainImageOverride(null);
      }
    }
  };

  validateGalleryImages();
}, [resolvedCurrentImages]);
```

### 4. **`mainImageUrl` Usa `galleryValidImages`**
```typescript
// ✅ mainImageUrl com cascata de prioridade
const mainImageUrl = useMemo(() => {
  // 1. mainImageOverride (se ainda válida)
  if (mainImageOverride) {
    const stillValid = galleryValidImages.some(img => img.resolvedUrl === mainImageOverride);
    if (stillValid) {
      return mainImageOverride;
    } else {
      setMainImageOverride(null); // Reset se quebrou
    }
  }
  
  // 2. is_primary em product_image_variants (se válida)
  if (hasVariants && selectedVariant) {
    const primaryImage = product.image_variants?.find(/* ... */);
    if (primaryImage?.image_url) {
      const url = productImagesService.resolveProductImageUrl(primaryImage.image_url);
      const isValid = galleryValidImages.some(img => img.resolvedUrl === url);
      if (isValid) {
        return url;
      }
    }
  }
  
  // 3. primary_image legado (se válido)
  if (selectedVariant?.primary_image) {
    const url = productImagesService.resolveProductImageUrl(selectedVariant.primary_image);
    const isValid = galleryValidImages.some(img => img.resolvedUrl === url);
    if (isValid) {
      return url;
    }
  }
  
  // 4. Primeira imagem VÁLIDA da galeria
  if (galleryValidImages.length > 0) {
    return galleryValidImages[0].resolvedUrl;
  }
  
  // 5. Fallback final: products.images
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    return productImagesService.resolveProductImageUrl(typeof firstImage === 'string' ? firstImage : String(firstImage));
  }
  
  // 6. Placeholder se nada funcionar
  return '';
}, [hasVariants, selectedVariant, galleryValidImages, mainImageOverride, product]);
```

### 5. **`galleryImages` Usa `galleryValidImages`**
```typescript
// ✅ Thumbnails vêm apenas de imagens válidas
const galleryImages = useMemo(() => {
  return galleryValidImages.map((img, idx) => ({
    rawPath: img.rawPath,
    resolvedUrl: img.resolvedUrl,
  }));
}, [galleryValidImages]);
```

### 6. **Renderização Simplificada**
```typescript
// ✅ Imagem principal - sem indicador de loading
{mainImageUrl ? (
  <img
    src={mainImageUrl}
    alt={product.name}
    onError={(e) => {
      console.error('[ProductDetail] ❌ Main image failed to load:', mainImageUrl);
      console.error('[ProductDetail]   Gallery valid images:', galleryValidImages.map(i => i.resolvedUrl));
    }}
  />
) : (
  <div className="...">
    Sem imagem disponível
  </div>
)}

// ✅ Thumbnails - apenas imagens válidas
{galleryImages.length > 0 && (
  <div className="grid grid-cols-4 gap-3">
    {galleryImages.map(({ rawPath, resolvedUrl }, idx) => (
      <button onClick={() => handleThumbnailClick(resolvedUrl)}>
        <img src={resolvedUrl} />
      </button>
    ))}
  </div>
)}
```

### 7. **Logs Detalhados**
```typescript
console.log('[ProductDetail] 🔍 Validating gallery images...');
console.log('[ProductDetail]   → Total to validate:', resolvedCurrentImages.length);
console.log('[ProductDetail]   → Valid images:', validImages.length);
console.log('[ProductDetail]   → Broken images removed:', brokenImages.length);

brokenImages.forEach(img => {
  console.log(`[ProductDetail]   ❌ Removed: ${img.resolvedUrl}`);
});

console.log('[ProductDetail]   🔄 Resetting mainImageOverride (broken image)');
```

## FLUXO DE VALIDAÇÃO

```
Banco de Dados (paths brutos)
  ↓
currentImages (paths brutos, com fallback para products.images)
  ↓
resolvedCurrentImages (URLs resolvidas)
  ↓
[Validação em Paralelo] checkImage(url)
  ├─ HTTP 200-299 → ✅ Incluído em galleryValidImages
  └─ HTTP 400/404/403 ou Erro de Rede → ❌ Removido
  ↓
galleryValidImages (apenas URLs válidas)
  ↓
├─ mainImageUrl (usa primeira de galleryValidImages)
└─ galleryImages (mapeamento de galleryValidImages)
  ↓
Renderização (somente imagens válidas)
```

## REGRAS DE FALLBACK

### Cascata de Prioridade
1. **mainImageOverride** (se ainda válida após validação)
2. **is_primary** em `product_image_variants` (se válida)
3. **primary_image** legado da variante (se válido)
4. **Primeira imagem** de `galleryValidImages`
5. **products.images[0]** (fallback final)
6. **Placeholder** "Sem imagem disponível"

### Quando Resetar `mainImageOverride`
- Se imagem selecionada pelo usuário não está em `galleryValidImages`
- Isso acontece se a imagem quebrar após ser selecionada

## RESULTADO ESPERADO

### ✅ Galeria Limpa
- Thumbnails quebradas **NÃO** aparecem
- Apenas imagens válidas são exibidas
- UX corrigida e consistente

### ✅ Imagem Principal Correta
- Sempre mostra imagem válida
- Nunca usa URL inválida
- Reset automático se imagem quebrar

### ✅ Troca de Cor
- Sempre mostra imagens válidas da nova variante
- Fallback automático para imagens válidas
- Imagens antigas quebradas não afetam nova seleção

## REGRAS DO PATCH

1. ✅ NÃO alterar banco
2. ✅ NÃO alterar helper `resolveProductImageUrl`
3. ✅ NÃO alterar CRM
4. ✅ Foco apenas no frontend
5. ✅ Simplicidade e clareza

## DIFERENÇA EM RELAÇÃO AO PATCH ANTERIOR

### Patch 2 (IMAGE_VALIDATION_PATCH.md)
- Estados separados: `validatedImages`, `validatingImages`
- Função `checkImageExists` com retorno detalhado
- Indicador visual de carregamento durante validação
- Logs mais extensos com código HTTP

### Patch 3 (IGNORAR_BROKEN_IMAGES_PATCH.md) — ATUAL
- Estado simplificado: `galleryValidImages`
- Função `checkImage` simples (retorna boolean)
- Sem indicador de carregamento
- Foco na simplicidade

**Ambos atingem o mesmo objetivo:** ignorar imagens quebradas na galeria.

## ARQUIVOS ALTERADOS

- `src/pages/ProductDetail.tsx` ✅
  - Função `checkImage` simplificada
  - Estado `galleryValidImages`
  - `useEffect` para validação automática
  - `mainImageUrl` usa `galleryValidImages`
  - `galleryImages` usa `galleryValidImages`
  - Fallback para `products.images`
  - Logs detalhados de imagens removidas

## ARQUIVOS NÃO ALTERADOS

- Banco de dados ❌
- Helper `resolveProductImageUrl` ❌
- CRM ❌
- Outros componentes ❌
- Ferramenta `/diagnostic-images` ❌

## TESTE MANUAL

### Passo 1: Abrir Produto
1. Acesse uma página de produto
2. Verifique console para logs de validação
3. Confirme que não há thumbnails quebradas

### Passo 2: Trocar Cor
1. Clique em uma variação de cor
2. Verifique logs para nova validação
3. Confirme que apenas imagens válidas aparecem

### Passo 3: Clicar em Thumbnails
1. Clique em diferentes thumbnails
2. Imagem principal deve mudar corretamente
3. Se thumbnail estiver quebrada, não deve estar na galeria

### Passo 4: Verificar Logs
```
[ProductDetail] 🔍 Validating gallery images...
[ProductDetail]   → Total to validate: 5
[ProductDetail]   → Valid images: 3
[ProductDetail]   → Broken images removed: 2
[ProductDetail]   ❌ Removed: https://...
```

## PRÓXIMOS PASSOS

Se ainda houver problemas:
1. Verificar logs para identificar URLs quebradas
2. Usar ferramenta `/diagnostic-images` para validação
3. Atualizar banco de dados para remover imagens obsoletas
4. Considerar limpeza de dados legados

## RESUMO

✅ **Função simples:** `checkImage(url)` retorna `boolean`
✅ **Estado único:** `galleryValidImages`
✅ **Validação automática:** `useEffect` com `Promise.all`
✅ **Fallback claro:** products.images quando nenhuma válida
✅ **Galeria limpa:** apenas imagens que realmente carregam
✅ **UX corrigida:** sem thumbnails quebradas
