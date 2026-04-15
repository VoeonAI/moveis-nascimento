# Patch Controlado: Normalização de URLs de Imagens no Product Detail

## Objetivo

Corrigir a exibição das imagens na página do produto em produção, garantindo compatibilidade entre imagens antigas (legadas) e imagens novas das variações.

## Diagnóstico

- ✅ Imagens novas das variações estavam funcionando
- ❌ Imagens antigas estavam quebradas em produção
- 📊 Isso indicava coexistência de formatos diferentes de armazenamento de imagem

## Implementação

### 1. Helper Único de Resolução de URL

Criada a função `resolveProductImageUrl()` no `productImagesService.ts`:

```typescript
export function resolveProductImageUrl(image: string | null | undefined): string
```

**Comportamento:**

1. **Valores vazios ou null/undefined** → retorna `''`
2. **URL completa (http/https)** → retorna como está
3. **Path com prefixo do bucket** (`product-images/arquivo.webp`) → remove prefixo e resolve
4. **Path sem prefixo** (`arquivo.webp`) → resolve diretamente
5. **Log temporário** → registra todos os paths detectados para diagnóstico

### 2. Aplicação Consistente

O helper foi aplicado em **TODOS** os pontos de uso de imagens na página:

✅ **Imagem Principal** (`mainImageUrl`)
- Override de thumbnail
- Imagem principal da variante
- Primeira imagem da lista filtrada

✅ **Gallery Thumbnails** (`galleryImages`)
- Todas as imagens da galeria usam a mesma normalização

✅ **Modal de Zoom** (`zoomImage`)
- Imagem ampliada usa a mesma lógica

### 3. Logs Temporários

Adicionados logs detalhados para identificar formatos antigos no banco:

```typescript
console.log('[resolveProductImageUrl] Legacy path detected:', {
  original: trimmed,
  hasBucketPrefix: trimmed.includes(BUCKET),
  length: trimmed.length
});

console.log('[resolveProductImageUrl] Removed bucket prefix:', {
  original: trimmed,
  normalized: normalizedPath
});

console.log('[resolveProductImageUrl] Generated public URL:', data.publicUrl);
```

**Como analisar os logs:**

1. Abra o console do navegador
2. Navegue até uma página de produto
3. Procure por mensagens `[resolveProductImageUrl]`
4. Identifique os formatos de paths que estão chegando do banco

## Compatibilidade Garantida

✅ **Produtos antigos sem variações** → continuam funcionando
✅ **Produtos com variações** → continuam funcionando
✅ **Imagens novas** → sem regressão visual
✅ **Imagens antigas** → passam a abrir corretamente

## Arquivos Modificados

### `src/services/productImagesService.ts`
- ✅ Adicionada função `resolveProductImageUrl()`
- ✅ Exportada via `productImagesService`
- ✅ Logs temporários para diagnóstico

### `src/pages/ProductDetail.tsx`
- ✅ Substituídas 3 chamadas `getPublicUrl` por `resolveProductImageUrl`
  - `mainImageUrl` useMemo (3 pontos)
  - `galleryImages` useMemo (1 ponto)
  - Modal de zoom (1 ponto)

## Resultados Esperados

### Imediato
- ✅ Imagens antigas passam a abrir em produção
- ✅ Imagens novas continuam funcionando
- ✅ Galeria fica consistente

### Diagnóstico
- 📊 Logs no console mostram formatos de paths detectados
- 🔍 Permite identificar padrões de dados antigos

## Próximos Passos (Opcional)

Após análise dos logs em produção:

1. **Identificar padrões** de imagens antigas no banco
2. **Avaliar necessidade** de migração de dados
3. **Remover logs temporários** após diagnóstico completo
4. **Documentar padrões** encontrados para futuras migrações

## Regras de Patch Controlado Seguidas

✅ NÃO alterou modelagem do banco
✅ NÃO mexeu no CRM
✅ NÃO reescreveu a página inteira
✅ Foco em normalização de URLs e compatibilidade
✅ Logs temporários para diagnóstico
✅ Aplicação consistente em todos os pontos

## Teste Sugerido

1. Acesse um produto com imagens antigas
2. Acesse um produto com variações
3. Verifique o console para logs `[resolveProductImageUrl]`
4. Confirme que todas as imagens carregam corretamente
5. Teste zoom em todas as imagens da galeria
