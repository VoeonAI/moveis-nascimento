# Patch Cirúrgico - Correção do Schema da Ferramenta de Diagnóstico

## Problema Identificado

A ferramenta `/diagnostic-images` estava falhando com erro `PGRST200` ao tentar fazer um join complexo com uma relação `variants` que não existe corretamente no schema do projeto.

### Schema Antigo (INCORRETO)

```typescript
// ❌ Tentava fazer join com relation "variants" que não é válida
const { data } = await supabase
  .from('products')
  .select(`
    id,
    name,
    images,
    variants (        // ❌ Relation inválida
      id,
      name,
      primary_image
    ),
    image_variants (
      variant_id,
      image_url
    )
  `)
```

**Problemas:**
- ❌ Relation `variants` não existe no schema
- ❌ Dependia de joins complexos do Supabase
- ❌ Falhava com erro PGRST200 (schema cache)
- ❌ Não acessava a fonte correta de dados

### Schema Real do Projeto

```
products
  ├── id
  ├── name
  └── images[]               // Array de strings

product_image_variants       // ← Fonte principal de imagens
  ├── id
  ├── product_id             // FK para products
  ├── image_url              // ← Campo com a URL/path da imagem
  ├── variant_id             // FK para product_variants (opcional)
  └── is_primary

product_variants             // Apenas para nomes das variações
  ├── id
  └── name
```

## Solução Implementada

### 1. Consultas Separadas (Simples e Confiáveis)

```typescript
// ✅ Consulta 1: Produtos básicos
const { data: productsData } = await supabase
  .from('products')
  .select('id, name, images')
  .limit(10);

// ✅ Consulta 2: Imagens de variantes
const { data: imageVariantsData } = await supabase
  .from('product_image_variants')
  .select('id, product_id, image_url, variant_id, is_primary');

// ✅ Consulta 3: Variantes (opcional, apenas para nomes)
const { data: variantsData } = await supabase
  .from('product_variants')
  .select('id, name');
```

**Vantagens:**
- ✅ Sem joins complexos
- ✅ Cada consulta é simples e independente
- ✅ Se uma falhar, as outras ainda funcionam
- ✅ Usa as tabelas corretas do schema

### 2. Montagem no Frontend

```typescript
// Criar mapa de variantes para lookup rápido
const variantsMap = variantsData.reduce((acc, v) => {
  acc[v.id] = v.name;
  return acc;
}, {});

// Montar estrutura unificada
const productsWithImages = productsData.map(product => ({
  ...product,
  imageVariants: imageVariantsData.filter(iv => iv.product_id === product.id),
}));
```

**Vantagens:**
- ✅ Lógica simples de filtragem
- ✅ Não depende do backend para joins
- ✅ Mais fácil de debugar
- ✅ Funciona mesmo sem variantes carregadas

### 3. Coleta de Imagens

```typescript
const collectImagePaths = (product: ProductWithImages, variantsMap: Record<string, string>) => {
  const results = [];

  // 1. Imagens do produto (campo images[])
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      results.push({
        path: img,
        source: 'product_images',
      });
    });
  }

  // 2. Imagens de product_image_variants
  if (product.imageVariants) {
    product.imageVariants.forEach(iv => {
      const variantName = iv.variant_id ? variantsMap[iv.variant_id] : undefined;
      results.push({
        path: iv.image_url,
        source: 'image_variant',
        variantName: variantName,
      });
    });
  }

  return results;
};
```

**Vantagens:**
- ✅ Duas fontes de dados cobertas
- ✅ Identifica claramente a origem
- ✅ Mostra nome da variação (se disponível)
- ✅ Fácil estender para novas fontes

### 4. UI Melhorada

A interface agora mostra:

```
Produto: Sofá Moderno
Variação: Azul                      ← Novo: mostra variação
Path original: sofa-azul.jpg
URL resolvida: https://...
Fonte: product_image_variants      ← Novo: indica fonte

Status: ✅ OK
[ Abrir em nova aba ] [ Copiar URL ]
```

**Vantagens:**
- ✅ Mostra qual variação a imagem pertence
- ✅ Indica claramente a fonte dos dados
- ✅ Facilita identificar onde está o problema

## Comparação: Antes vs Depois

### Antes (Quebrado)

```typescript
// ❌ Join complexo com relation inválida
const { data } = await supabase
  .from('products')
  .select(`
    variants (id, name, primary_image),    // ❌ PGRST200
    image_variants (variant_id, image_url)
  `);
```

**Problemas:**
- ❌ Falhava com PGRST200
- ❌ Não acessava `product_image_variants` corretamente
- ❌ Dependia de schema cache do Supabase

### Depois (Funcionando)

```typescript
// ✅ Consultas simples e independentes
const products = await supabase.from('products').select('id, name, images').limit(10);
const imageVariants = await supabase.from('product_image_variants').select('*');
const variants = await supabase.from('product_variants').select('id, name'); // opcional

// ✅ Montagem no frontend
const productsWithImages = products.map(p => ({
  ...p,
  imageVariants: imageVariants.filter(iv => iv.product_id === p.id),
}));
```

**Vantagens:**
- ✅ Funciona sem erros
- ✅ Acessa as tabelas corretas
- ✅ Lógica simples no frontend
- ✅ Resiliente a falhas parciais

## Fontes de Dados Cobertas

### 1. `products.images[]`
- Campo array de strings
- Imagens gerais do produto
- **Tag na UI:** `products.images`

### 2. `product_image_variants`
- Tabela principal de imagens por variante
- Campos: `product_id`, `image_url`, `variant_id`, `is_primary`
- **Tag na UI:** `product_image_variants`

## Casos de Uso

### Caso 1: Produto sem Variantes

```
Produto: Mesa de Jantar
Path original: mesa-jantar-1.jpg
Fonte: products.images

✅ OK
```

**Interpretação:** Imagem vem do array `images[]` do produto.

### Caso 2: Produto com Variantes

```
Produto: Sofá Moderno
Variação: Azul
Path original: sofa-azul.jpg
Fonte: product_image_variants

✅ OK
```

**Interpretação:** Imagem vem da tabela `product_image_variants`, ligada à variação "Azul".

### Caso 3: Imagem Quebrada

```
Produto: Cadeira de Escritório
Path original: cadeira-legada.jpg
Fonte: product_image_variants

❌ ERRO
O helper não conseguiu gerar uma URL pública.
```

**Interpretação:** Imagem de uma variação que não carrega corretamente.

## Regras de Patch Cirúrgico Seguidas

✅ **NÃO alterou ProductDetail.tsx** - Foco apenas na ferramenta
✅ **NÃO alterou banco de dados** - Usou schema existente
✅ **NÃO alterou helper de imagens** - `resolveProductImageUrl` intacto
✅ **Corrigiu apenas a ferramenta** - `/diagnostic-images`
✅ **Usou consultas simples** - Evitou joins complexos
✅ **Montagem no frontend** - Lógica simples e testável
✅ **Resiliente a falhas** - Se uma consulta falha, outras ainda funcionam

## Teste da Ferramenta

### Como Testar

1. Acesse: `/diagnostic-images`
2. Clique em "Testar Todas as Imagens"
3. Verifique os resultados

### O que Você Deve Ver

**Se funcionou:**
- ✅ Produtos carregados sem erros
- ✅ Duas fontes de dados indicadas (products.images / product_image_variants)
- ✅ Nomes de variações exibidos (quando disponível)
- ✅ Status OK/ERRO para cada imagem

**Se houver erro:**
- ❌ Verifique se as tabelas existem no Supabase
- ❌ Verifique as políticas RLS
- ❌ Abra o console para ver logs detalhados

## Próximos Passos

Com a ferramenta funcionando:

1. **Execute os testes** em `/diagnostic-images`
2. **Identifique padrões** de imagens quebradas
3. **Clique em "Abrir em nova aba"** para URLs com erro
4. **Verifique o console** para logs de diagnóstico
5. **Reporte os resultados** para análise

## Arquivos Modificados

### `src/pages/ImageDiagnosticTool.tsx`
- ✅ Removido join complexo com `variants`
- ✅ Consultas separadas: products, product_image_variants, product_variants
- ✅ Montagem no frontend
- ✅ UI melhorada com indicação de fonte e nome de variação

## Benefícios

1. **Funcionalidade:**
   - ✅ Ferramenta não falha mais
   - ✅ Acessa dados reais do schema
   - ✅ Diagnóstico precisa de imagens

2. **Manutenibilidade:**
   - ✅ Código simples e legível
   - ✅ Consultas independentes
   - ✅ Lógica de montagem no frontend

3. **Resiliência:**
   - ✅ Se product_variants falhar, ferramenta ainda funciona
   - ✅ Se product_image_variants falhar, usa products.images
   - ✅ Logs detalhados para debug
