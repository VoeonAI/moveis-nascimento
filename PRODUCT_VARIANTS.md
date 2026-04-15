# Suporte a Variações de Produto (Cores)

## Overview

Esta funcionalidade permite que um produto tenha múltiplas variações (ex: cores), cada uma com sua própria galeria de imagens, sem duplicar produtos.

## Arquitetura

### Tabelas no Banco de Dados

#### `product_variants`
- `id`: UUID (PK)
- `product_id`: UUID (FK → products.id, CASCADE DELETE)
- `name`: TEXT (ex: "Branco", "Madeira")
- `slug`: TEXT (ex: "branco", "madeira")
- `is_default`: BOOLEAN (indica a variação padrão)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### `product_variant_images`
- `id`: UUID (PK)
- `variant_id`: UUID (FK → product_variants.id, CASCADE DELETE)
- `image_url`: TEXT (caminho da imagem no storage)
- `sort_order`: INTEGER (ordem de exibição)
- `created_at`: TIMESTAMP

### Interfaces TypeScript

```typescript
export interface ProductVariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductVariantImage[];
}

export interface Product {
  // ... campos existentes
  variants?: ProductVariant[];
}
```

## Funcionalidades Implementadas

### 1. Página de Produto (ProductDetail.tsx)

#### Comportamento com Variantes:
- Se o produto possui variantes (`product.variants?.length > 0`):
  - Mostra seletor de cor/variante
  - A galeria de imagens muda conforme a seleção
  - Usa imagens da variante selecionada
  - Primeira variante é marcada como `is_default` e selecionada automaticamente

#### Comportamento sem Variantes (Fallback):
- Usa o sistema existente (`product.images`)
- Nenhuma mudança visual para produtos antigos

### 2. Admin - Modal de Produto (Catalog.tsx)

#### Adicionar Variação:
1. Digite o nome da variação (ex: "Branco")
2. Clique em "Adicionar"
3. Selecione imagens para a variação
4. Clique em "Fotos" para adicionar as imagens

#### Gerenciar Variantes:
- **Definir como Padrão**: Ícone de estrela define a variação como padrão
- **Remover**: Exclui a variação e suas imagens
- **Adicionar Imagens**: Selecione múltiplas imagens e clique em "Fotos"
- **Remover Imagens**: Clique na imagem (hover) para excluir

### 3. Service de Produtos (productsService.ts)

Todos os métodos retornam variantes com suas imagens:

```typescript
// listPublicProducts
// getProductById
// listAllProducts
```

Cada método:
1. Faz query incluindo `product_variants` e `product_variant_images`
2. Ordena variantes: default primeiro, depois por nome
3. Ordena imagens dentro de cada variante por `sort_order`

## Segurança (RLS)

### product_variants
- **SELECT**: TO authenticated (true) - Todos usuários autenticados podem ver
- **INSERT**: TO authenticated (true) - Todos podem criar
- **UPDATE**: TO authenticated (true) - Todos podem atualizar
- **DELETE**: TO authenticated (true) - Todos podem deletar

### product_variant_images
- **SELECT**: TO authenticated (true)
- **INSERT**: TO authenticated (true)
- **UPDATE**: TO authenticated (true)
- **DELETE**: TO authenticated (true)

**Nota**: RLS simplificado para permitir que qualquer usuário autenticado gerencie variantes. Em produção, considere adicionar verificações mais específicas baseadas em roles.

## Fluxo de Dados

### Criar Produto com Variações

1. **Admin**:
   - Cria produto (padrão)
   - Adiciona variações com imagens
   - Salva

2. **Backend** (handleSave):
   - Salva produto
   - Para cada variação:
     - Cria registro em `product_variants`
     - Faz upload de imagens para storage
     - Cria registros em `product_variant_images`

3. **Frontend (Página de Produto)**:
   - Busca produto com variantes (getProductById)
   - Mostra seletor de cor
   - Exibe imagens da variante selecionada

### Exemplo de Query

```typescript
const { data } = await supabase
  .from('products')
  .select(`
    id, name, description, images, metadata, active, featured, on_promotion, created_at,
    product_variants (
      id, product_id, name, slug, is_default, created_at, updated_at,
      product_variant_images (
        id, variant_id, image_url, sort_order, created_at
      )
    )
  `)
  .eq('id', productId);
```

## Compatibilidade com Produtos Antigos

✅ **Não quebra produtos existentes**
- Produtos sem variantes continuam usando `product.images`
- Interface `Product` é backward compatible
- Nenhuma alteração necessária em produtos antigos

✅ **Incremental**
- Variações são opcionais
- Produtos podem ter ou não variantes
- Transição transparente para usuário

## Estrutura de Arquivos

### Modificados
- `src/services/productsService.ts` - Adicionada interface ProductVariant e queries com variantes
- `src/pages/ProductDetail.tsx` - Adicionado seletor de variante e lógica de troca de galeria
- `src/pages/app/Catalog.tsx` - Adicionado gerenciamento de variantes no modal
- `src/types/index.ts` - Adicionado variants à interface Product

### Criados
- `src/pages/app/Catalog.tsx` - Gerenciamento de variantes no modal (adicionado)

### Banco de Dados
- `public.product_variants` - Tabela de variantes
- `public.product_variant_images` - Tabela de imagens de variantes

## Testes Manuais Sugeridos

### 1. Produto sem Variações
- Acesse página de produto existente
- Verifique se aparece normalmente
- Confirme que não mostra seletor de cor

### 2. Produto com Variações
- No admin, edite um produto
- Adicione 2-3 variações com nomes (ex: "Branco", "Madeira", "Preto")
- Adicione imagens para cada variação
- Salve
- Acesse página do produto
- Verifique se aparece seletor de cor
- Clique em cada variação
- Confirme se as imagens mudam corretamente

### 3. Marcar Variação como Padrão
- No admin, clique na estrela de uma variação
- Salve
- Acesse página do produto
- Confirme se a variação padrão está selecionada

### 4. Remover Variação
- No admin, remova uma variação
- Salve
- Confirme se a variação foi removida da lista

## Limitações Conhecidas

1. **Preços por Variante**: Atualmente não implementado (usaria price na tabela product_variants)
2. **Estoque por Variante**: Atualmente não implementado (usaria quantity na tabela product_variants)
3. **RLS Simplificado**: Em produção, considerar roles específicas para gerenciamento
4. **Slug Collision**: Não há verificação de duplicidade de slug no momento

## Próximos Passos (Opcional)

- [ ] Adicionar preço específico por variação
- [ ] Adicionar controle de estoque por variação
- [ ] Implementar verificação de slug único
- [ ] Adicionar preview de imagem ao selecionar arquivos no admin
- [ ] Implementar drag-and-drop para ordenar imagens
- [ ] Adicionar RLS baseado em roles (MASTER, GESTOR, etc.)

## Notas Importantes

1. **Imagens**: As imagens das variantes são armazenadas em `storage/product_images/{product_id}/variants/{variant_id}/`
2. **Fallback**: Se uma variação não tiver imagens, o sistema não mostra nada (pode ser melhorado para usar imagens do produto)
3. **Default**: Sempre deve haver pelo menos uma variação marcada como default
4. **Ordenação**: Variantes são ordenadas automaticamente (default primeiro, depois alfabeticamente)
