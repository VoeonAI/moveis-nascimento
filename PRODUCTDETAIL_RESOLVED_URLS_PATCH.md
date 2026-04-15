# PATCH CIRÚRGICO — GARANTIR URLs RESOLVIDAS NO ProductDetail

## OBJETIVO
Corrigir a galeria do ProductDetail para que imagem principal e thumbnails usem **somente URLs finais resolvidas**, eliminando qualquer uso de paths brutos do banco no `src`.

## DATA
2025-01-17

## PROBLEMAS IDENTIFICADOS

### 1. **mainImageOverride guardava path bruto**
```typescript
// ❌ ANTES
const handleThumbnailClick = (imagePath: string) => {
  setMainImageOverride(imagePath); // Guardava path bruto do banco
};
```

### 2. **handleImageClick usava path bruto no zoom**
```typescript
// ❌ ANTES
const handleImageClick = (imagePath: string) => {
  setZoomImage(imagePath); // Guardava path bruto
};
```

### 3. **mainImageUrl re-resolvia override**
```typescript
// ❌ ANTES
if (mainImageOverride) {
  return productImagesService.resolveProductImageUrl(mainImageOverride); // Re-resolvia
}
```

### 4. **Zoom modal re-resolvia a imagem**
```typescript
// ❌ ANTES
{zoomImage && (
  <img
    src={productImagesService.resolveProductImageUrl(zoomImage)} // Re-resolvia
  />
)}
```

## SOLUÇÃO APLICADA

### 1. **Criar lista memoizada de imagens resolvidas**
```typescript
// ✅ DEPOIS
const resolvedCurrentImages = useMemo(() => {
  const resolved = currentImages
    .map(img => {
      const rawPath = typeof img === 'string' ? img : (img.image_url || img.url || String(img));
      const resolvedUrl = productImagesService.resolveProductImageUrl(rawPath);
      return {
        rawPath,
        resolvedUrl,
        hasValidUrl: !!resolvedUrl && resolvedUrl !== rawPath
      };
    })
    .filter(img => img.hasValidUrl); // Apenas URLs válidas
  
  return resolved;
}, [currentImages]);
```

### 2. **Atualizar mainImageUrl para usar resolvedCurrentImages**
```typescript
// ✅ DEPOIS
// 4. Se não tem imagem principal, usa a PRIMEIRA URL RESOLVIDA
if (resolvedCurrentImages.length > 0) {
  const url = resolvedCurrentImages[0].resolvedUrl;
  return url;
}
```

### 3. **mainImageOverride agora guarda URL resolvida**
```typescript
// ✅ DEPOIS
// 1. Se usuário clicou em uma thumbnail específica, usa essa (JÁ RESOLVIDA)
if (mainImageOverride) {
  console.log('[ProductDetail]   → Using override:', mainImageOverride);
  return mainImageOverride; // Já está resolvida, não re-resolve
}
```

### 4. **Handlers recebem URLs resolvidas**
```typescript
// ✅ DEPOIS
const handleThumbnailClick = (resolvedUrl: string) => {
  console.log('[ProductDetail] 🔍 handleThumbnailClick called:', resolvedUrl);
  setMainImageOverride(resolvedUrl); // Guarda URL resolvida
};

const handleImageClick = (resolvedUrl: string) => {
  console.log('[ProductDetail] 🔍 handleImageClick called:', resolvedUrl);
  setZoomImage(resolvedUrl); // Guarda URL resolvida
};
```

### 5. **galleryImages usa resolvedCurrentImages**
```typescript
// ✅ DEPOIS
const galleryImages = useMemo(() => {
  return resolvedCurrentImages.map((img, idx) => {
    return {
      rawPath: img.rawPath,
      resolvedUrl: img.resolvedUrl,
    };
  });
}, [resolvedCurrentImages]);
```

### 6. **Renderização usa URLs resolvidas**
```typescript
// ✅ DEPOIS - Main image
onClick={() => mainImageUrl && handleImageClick(mainImageUrl)}
// mainImageUrl já está resolvido

// ✅ DEPOIS - Thumbnails
{galleryImages.map(({ rawPath, resolvedUrl }, idx) => (
  <button onClick={() => handleThumbnailClick(resolvedUrl)}>
    <img src={resolvedUrl} />
  </button>
))}

// ✅ DEPOIS - Zoom modal
{zoomImage && (
  <img
    src={zoomImage} // Já está resolvido, sem re-resolver
  />
)}
```

## LOGS ADICIONADOS

### No cálculo de resolvedCurrentImages
```typescript
console.log('[ProductDetail] 🔍 resolvedCurrentImages calculation:');
console.log('[ProductDetail]   → Total raw paths:', currentImages.length);
console.log('[ProductDetail]   → Valid resolved URLs:', resolved.length);
resolved.forEach((img, idx) => {
  console.log(`[ProductDetail]   [${idx}] Raw: ${img.rawPath}`);
  console.log(`[ProductDetail]   [${idx}] Resolved: ${img.resolvedUrl}`);
});
```

### No render do componente
```typescript
console.log('═══════════════════════════════════════════════════');
console.log('[ProductDetail] 🖼️ RENDER STATE:');
console.log('[ProductDetail]   Product:', product.name);
console.log('[ProductDetail]   currentImages (raw):', currentImages);
console.log('[ProductDetail]   resolvedCurrentImages:', resolvedCurrentImages.map(i => i.resolvedUrl));
console.log('[ProductDetail]   mainImageUrl:', mainImageUrl);
console.log('[ProductDetail]   mainImageOverride:', mainImageOverride);
console.log('[ProductDetail]   zoomImage:', zoomImage);
console.log('[ProductDetail]   galleryImages:', galleryImages.map(g => g.resolvedUrl));
console.log('═══════════════════════════════════════════════════');
```

## REGRAS DO PATCH

1. ✅ NÃO alterar banco
2. ✅ NÃO alterar helper `resolveProductImageUrl`
3. ✅ NÃO alterar CRM
4. ✅ NÃO alterar layout
5. ✅ Foco apenas no ProductDetail
6. ✅ Patch mínimo e cirúrgico

## RESULTADO ESPERADO

- ✅ ProductDetail passa a exibir **somente** as imagens que a ferramenta `/diagnostic-images` já validou como OK
- ✅ Imagem principal e thumbnails deixam de quebrar
- ✅ Troca de cor continua funcionando
- ✅ Zoom modal funciona corretamente
- ✅ Todos os `src` de imagens usam URLs finais resolvidas
- ✅ Logs detalhados permitem debugar problemas

## FLUXO DE RESOLUÇÃO

```
Banco de Dados (paths brutos)
  ↓
currentImages (paths brutos: image_url, primary_image, product.images[])
  ↓
resolvedCurrentImages (URLs resolvidas via productImagesService.resolveProductImageUrl)
  ↓
├─ mainImageUrl (URL resolvida - usa primeira de resolvedCurrentImages)
├─ galleryImages (URLs resolvidas - mapeamento de resolvedCurrentImages)
├─ handleThumbnailClick (recebe URL resolvida)
└─ handleImageClick (recebe URL resolvida)
  ↓
Renderização (todos os src usam URLs resolvidas)
```

## PRÓXIMOS PASSOS

1. **Testar no navegador:**
   - Abrir a página de um produto
   - Verificar logs no console
   - Conferir se imagens carregam corretamente
   - Trocar variações de cor
   - Clicar em thumbnails
   - Abrir zoom modal

2. **Verificar logs:**
   - `resolvedCurrentImages` deve mostrar URLs válidas
   - `mainImageUrl` deve ser uma URL resolvida
   - `galleryImages` devem ser URLs resolvidas

3. **Se houver problemas:**
   - Verificar logs para identificar URLs quebradas
   - Usar ferramenta `/diagnostic-images` para validar
   - Ajustar banco de dados conforme necessário

## ARQUIVOS ALTERADOS

- `src/pages/ProductDetail.tsx` ✅

## ARQUIVOS NÃO ALTERADOS (CONFORME REGRAS)

- `src/services/productImagesService.ts` ❌
- Banco de dados ❌
- CRM ❌
- Outros componentes ❌
