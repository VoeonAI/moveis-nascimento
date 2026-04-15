# Patch Controlado - Validação e Correção da Galeria no ProductDetail

## Objetivo

Garantir que a galeria de imagens no ProductDetail renderize corretamente com base nas fontes de dados validadas (products.images e product_image_variants).

## Problemas Identificados e Corrigidos

### 1. Filtro Incorreto de image_variants

**Problema Anterior:**

```typescript
// ❌ Filtrava apenas por variant_id
const variantImages = product.image_variants
  ?.filter(iv => iv.variant_id === selectedVariant.id)
  .map(iv => iv.image_url) || [];
```

**Problema:**
- Não verificava se a imagem pertence ao produto atual
- Podia mostrar imagens de variantes de outros produtos
- `ProductImageVariant` tem `product_id` e `variant_id`

**Correção Aplicada:**

```typescript
// ✅ Filtra por AMBOS product_id e variant_id
const variantImages = product.image_variants
  ?.filter(iv => 
    iv.product_id === product.id &&  // Garante que é do produto atual
    iv.variant_id === selectedVariant.id  // Filtra pela variante selecionada
  )
  .map(iv => iv.image_url) || [];
```

**Benefícios:**
- ✅ Mostra apenas imagens da variante do produto atual
- ✅ Evita vazamento de dados entre produtos
- ✅ Lógica mais segura e previsível

---

### 2. Priorização Incorreta de Imagem Principal

**Problema Anterior:**

```typescript
// ❌ Ordem incorreta de prioridade
if (mainImageOverride) { ... }
if (selectedVariant?.primary_image) { ... }
if (currentImages.length > 0) { ... }
```

**Problema:**
- Não priorizava imagens marcadas como `is_primary` em `product.image_variants`
- Dependia apenas de `selectedVariant.primary_image` (campo legado)
- Não considerava a flag `is_primary` da tabela correta

**Correção Aplicada:**

```typescript
// ✅ Ordem correta de prioridade
// 1. Override por clique na thumbnail
if (mainImageOverride) { ... }

// 2. Imagem marcada como is_primary em product.image_variants
if (hasVariants && selectedVariant) {
  const primaryImage = product.image_variants
    ?.find(iv => 
      iv.product_id === product.id &&
      iv.variant_id === selectedVariant.id &&
      iv.is_primary  // ← Nova prioridade
    );
  
  if (primaryImage?.image_url) { ... }
}

// 3. Campo legado primary_image da variante
if (selectedVariant?.primary_image) { ... }

// 4. Primeira imagem da lista filtrada
if (currentImages.length > 0) { ... }
```

**Benefícios:**
- ✅ Respeita a flag `is_primary` da tabela correta
- ✅ Mantém compatibilidade com campo legado
- ✅ Fallback em cascata robusto

---

### 3. Fallback Robusto em currentImages

**Problema Anterior:**

```typescript
// ❌ Fallback direto para product.images[]
if (variantImages.length > 0) {
  return variantImages;
}
return Array.isArray(product.images) ? product.images : [];
```

**Correção Aplicada:**

```typescript
// ✅ Fallback em cascata com logs
if (variantImages.length > 0) {
  return variantImages;  // ✅ Imagens da variante
}

// Fallback 1: primary_image da variante
if (selectedVariant.primary_image) {
  return [selectedVariant.primary_image];  // ✅ Campo legado
}

// Fallback 2: todas as imagens do produto
return Array.isArray(product.images) ? product.images : [];
```

**Benefícios:**
- ✅ Mais resiliência quando variantes não têm imagens
- ✅ Usa todas as fontes disponíveis
- ✅ Logs para debug

---

### 4. Logs Detalhados para Debug

**Adicionados logs em pontos críticos:**

```typescript
// currentImages calculation
console.log('[ProductDetail] 🔍 currentImages calculation:');
console.log('[ProductDetail]   Product:', product.name);
console.log('[ProductDetail]   Has variants:', hasVariants);
console.log('[ProductDetail]   Selected variant:', selectedVariant?.id);
console.log('[ProductDetail]   → Found', variantImages.length, 'images');

// mainImageUrl calculation
console.log('[ProductDetail] 🔍 mainImageUrl calculation:');
console.log('[ProductDetail]   → Using override:', mainImageOverride);
console.log('[ProductDetail]   → URL:', url);

// Variant selection
console.log('[ProductDetail] 🔍 handleVariantSelect called:');
console.log('[ProductDetail]   → Variant ID:', variant.id);
console.log('[ProductDetail]   → Has primary_image:', !!variant.primary_image);

// Thumbnail click
console.log('[ProductDetail] 🔍 handleThumbnailClick called:', imagePath);

// Variant change
console.log('[ProductDetail] 🔍 Variant changed, resetting mainImageOverride');

// Image loading
console.log('[ProductDetail] ✅ Main image loaded successfully:', mainImageUrl);
console.error('[ProductDetail] ❌ Main image failed to load:', mainImageUrl);
console.error('[ProductDetail] ❌ Thumbnail failed to load:', url);
```

**Benefícios:**
- ✅ Rastreabilidade completa do fluxo de imagens
- ✅ Fácil identificar onde falha
- ✅ Debug em produção

---

## Comportamento da Galeria Corrigido

### 1. Carregamento Inicial

```
Produto carregado
  ↓
Variantes carregadas
  ↓
Variante padrão selecionada (is_default ou primeira)
  ↓
currentImages calculado com filtros corretos
  ↓
mainImageUrl calculado com prioridade:
  1. is_primary em product_image_variants
  2. primary_image da variante
  3. Primeira da lista
  ↓
Imagem principal exibida
  ↓
Thumbnails renderizadas com currentImages
```

### 2. Troca de Variante

```
Usuário clica em botão de cor
  ↓
handleVariantSelect chamado
  ↓
selectedVariant atualizado
  ↓
useEffect detecta mudança
  ↓
mainImageOverride resetado para null
  ↓
currentImages recalculado (nova variante)
  ↓
mainImageUrl recalculado
  ↓
Galeria atualiza com imagens da nova variante
```

### 3. Clique em Thumbnail

```
Usuário clica em thumbnail
  ↓
handleThumbnailClick chamado
  ↓
mainImageOverride definido com path da thumbnail
  ↓
mainImageUrl recalculado usando override
  ↓
Imagem principal atualiza
  ↓
Thumbnail fica destacada (border verde)
```

---

## Regras de Patch Controlado Seguidas

✅ **NÃO alterou banco de dados** - Usou schema existente
✅ **NÃO alterou helper de imagens** - `resolveProductImageUrl` intacto
✅ **NÃO alterou CRM** - Foco apenas em ProductDetail
✅ **NÃO alterou layout** - Apenas lógica de renderização
✅ **Corrigiu apenas comportamento visual da galeria**
✅ **Fallbacks robustos implementados**
✅ **Logs detalhados para debug**
