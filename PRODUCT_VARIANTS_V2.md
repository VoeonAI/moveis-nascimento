# Suporte a Variações de Produto (Cores) - V2

## Overview

Esta funcionalidade permite que um produto tenha múltiplas variações (ex: cores) com vínculos flexíveis entre a galeria do produto e as variações.

## Arquitetura Atualizada

### Tabelas no Banco de Dados

#### `product_variants` (sem alterações)
- `id`: UUID (PK)
- `product_id`: UUID (FK → products.id, CASCADE DELETE)
- `name`: TEXT (ex: "Branco", "Madeira")
- `slug`: TEXT (ex: "branco", "madeira")
- `is_default`: BOOLEAN (indica a variação padrão)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### `product_image_variants` (NOVA - many-to-many)
- `id`: UUID (PK)
- `product_id`: UUID (FK → products.id, CASCADE DELETE)
- `image_url`: TEXT (URL da imagem na galeria do produto)
- `variant_id`: UUID (FK → product_variants.id, CASCADE DELETE)
- `is_primary`: BOOLEAN (indica se é a imagem principal desta variação)
- `created_at`: TIMESTAMP

#### `product_variant_images` (MANTIDA mas não usada)
- Esta tabela continua existindo mas não é mais utilizada
- Pode ser removida no futuro após migração completa

### Interfaces TypeScript

```typescript
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  is_default: boolean;
  primary_image?: string; // URL da imagem principal desta variação
  created_at: string;
  updated_at: string;
}

export interface ProductImageVariant {
  id: string;
  product_id: string;
  image_url: string;
  variant_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  // ... campos existentes
  variants?: ProductVariant[];
  image_variants?: ProductImageVariant[]; // Vínculos imagem-variação
}
```

## Mudanças em Relação à V1

### V1 (Anterior)
- Cada variação tinha sua própria galeria de imagens isolada
- Imagens duplicadas entre variações
- Complexidade para gerenciar imagens semelhantes em múltiplas variações
- Tabela `product_variant_images` armazenava imagens por variação

### V2 (Atual)
- Produto tem uma galeria única (`product.images`)
- Cada imagem pode ser vinculada a uma ou mais variações
- Não há duplicação de imagens
- Tabela `product_image_variants` faz vínculo many-to-many
- Cada variação pode ter uma imagem principal marcada com `is_primary`

## Funcionalidades Implementadas

### 1. Página de Produto (ProductDetail.tsx)

#### Comportamento com Variantes:
- Se o produto possui variantes:
  - Mostra seletor de cor/variante
  - A galeria filtra imagens vinculadas à variação selecionada
  - Usa `primary_image` da variante se disponível
  - Se não tiver imagens vinculadas, usa fallback para todas as imagens do produto

#### Sem Variantes (Fallback):
- Usa todas as imagens do produto (`product.images`)
- Nenhuma mudança visual

### 2. Admin - Modal de Produto (Catalog.tsx)

#### Adicionar Variação:
1. Digite o nome da variação (ex: "Branco", "Madeira")
2. Clique em "Adicionar"
3. A variação aparece na lista

#### Vincular Imagens a Variações:
1. Na seção "Galeria do Produto", clique em uma imagem
2. Abre diálogo com todas as variações
3. Clique em "Adicionar" para vincular a imagem a uma variação
4. Clique em "Definir Principal" para marcar como imagem principal da variação
5. Clique em "Remover" para desvincular a imagem de uma variação

#### Gerenciar Variações:
- **Definir como Padrão**: Ícone de estrela define a variação como default
- **Remover**: Exclui a variação e todos os vínculos imagem-variação
- **Contagem de Imagens**: Mostra quantas imagens estão vinculadas a cada variação

### 3. Service de Produtos (productsService.ts)

Todos os métodos retornam variantes com `primary_image` e `image_variants`:

```typescript
// getProductById
// listPublicProducts
// listAllProducts
```

Para cada variante:
1. Busca `product_image_variants` vinculados à variante
2. Encontra a imagem marcada como `is_primary`
3. Define `primary_image` na variante

## Fluxo de Dados

### Criar Produto com Variações

1. **Admin**:
   - Cria produto (padrão)
   - Adiciona imagens à galeria do produto
   - Adiciona variações (ex: "Branco", "Madeira")
   - Clica em cada imagem e vincula às variações
   - Define imagem principal para cada variação
   - Salva

2. **Backend** (handleSave):
   - Salva produto com galeria (`product.images`)
   - Salva variantes em `product_variants`
   - Salva vínculos imagem-variação em `product_image_variants`
   - Remove vínculos antigos e cria novos

3. **Frontend (Página de Produto)**:
   - Busca produto com variantes e image_variants
   - Mostra seletor de cor
   - Ao selecionar cor, filtra `currentImages` pelos vínculos da variação
   - Usa `primary_image` como imagem inicial da galeria

### Exemplo de Query

```typescript
const { data } = await supabase
  .from('products')
  .select(`
    id, name, description, images, metadata, active, featured, on_promotion, created_at,
    product_categories (
      categories (*)
    ),
    product_variants (
      id, product_id, name, slug, is_default, created_at, updated_at
    ),
    product_image_variants (
      id, product_id, image_url, variant_id, is_primary, created_at
    )
  `)
  .eq('id', productId);
```

### Exemplo de Filtragem de Imagens

```typescript
// Filtrar imagens vinculadas à variante selecionada
const currentImages = product.image_variants
  ?.filter(iv => iv.variant_id === selectedVariant.id)
  .map(iv => iv.image_url) || [];

// Se não tiver imagens vinculadas, usa todas as imagens do produto
if (currentImages.length === 0) {
  currentImages = product.images;
}
```

## Correções Implementadas

### 1. ✅ Exclusão de Variação Funciona
- `handleRemoveVariant` remove:
  - Registro de `product_variants`
  - Todos os vínculos em `product_image_variants`
  - Atualiza estado local corretamente
- Se removendo variação default, torna primeira variação como default

### 2. ✅ Principal/Default Funciona
- `is_default` define a variação inicialmente selecionada
- `is_primary` define a imagem principal de cada variação
- `primary_image` é populado automaticamente nos dados retornados

### 3. ✅ Galeria Troca ao Selecionar Cor
- `currentImages` é recalculado via `useMemo` quando `selectedVariant` muda
- Filtra imagens por vínculos na tabela `product_image_variants`
- Usa `primary_image` da variante ou primeira imagem da lista
- Fallback seguro para produtos sem vínculos

### 4. ✅ Admin Gerencia Vínculos
- Diálogo intuitivo para vincular imagens a variações
- Visualização de quantas variações cada imagem tem
- Marcar/remover principal por variação
- Não duplica imagens físicas

## Segurança (RLS)

### product_image_variants
- **SELECT**: TO authenticated (true) - Todos usuários autenticados podem ver
- **INSERT**: TO authenticated (true) - Todos podem criar
- **UPDATE**: TO authenticated (true) - Todos podem atualizar
- **DELETE**: TO authenticated (true) - Todos podem deletar

## Compatibilidade

### Produtos Antigos (sem variações)
- ✅ Continuam usando `product.images`
- ✅ Nenhuma mudança visual
- ✅ Nenhuma alteração necessária

### Produtos com Variações V1
- ⚠️ Migração necessária de `product_variant_images` para `product_image_variants`
- ⚠️ Tabela antiga pode ser removida após migração

## Estrutura de Arquivos

### Modificados
- `src/services/productsService.ts` - Adicionado `product_image_variants` nas queries
- `src/pages/ProductDetail.tsx` - Filtra imagens por variação selecionada
- `src/pages/app/Catalog.tsx` - Admin para gerenciar vínculos imagem-variação
- `src/types/index.ts` - Adicionado `image_variants` e `primary_image` às interfaces

### Criados no Banco
- `public.product_image_variants` - Tabela de vínculos imagem-variação

## Testes Manuais Sugeridos

### 1. Produto sem Variações
- Acesse página de produto existente
- Verifique se aparece normalmente
- Confirme que não mostra seletor de cor

### 2. Criar Produto com Variações
1. No admin, edite um produto
2. Adicione 2-3 variações (ex: "Branco", "Madeira", "Preto")
3. Adicione algumas imagens ao produto
4. Clique em cada imagem e vincule às variações
5. Defina uma imagem principal para cada variação
6. Salve

### 3. Testar Página Pública
1. Acesse página do produto
2. Verifique se aparece seletor de cor
3. Clique em cada variação
4. Confirme se a galeria filtra as imagens corretamente
5. Confirme se a imagem principal é mostrada primeiro
6. Verifique se clicando nas thumbnails funciona

### 4. Testar Remoção de Variação
1. No admin, remova uma variação
2. Salve
3. Confirme se os vínculos foram removidos
4. Verifique se a contagem de imagens das outras variações não mudou

### 5. Testar Definir como Principal
1. No admin, mude a variação default clicando na estrela
2. Salve
3. Acesse página pública
4. Confirme se a nova variação default está selecionada

## Vantagens da V2 em Relação à V1

1. **Sem Duplicação**: Imagens podem ser compartilhadas entre variações
2. **UX Melhor**: Uma galeria única é mais simples de gerenciar
3. **Flexibilidade**: A mesma imagem pode ser usada em múltiplas variações
4. **Performance**: Menos imagens no storage
5. **Consistência**: Mudanças na imagem afetam todas as variações vinculadas

## Notas Importantes

1. **Imagens**: Todas as imagens estão em `product.images`
2. **Vínculos**: `product_image_variants` conecta imagens a variações
3. **Principal**: Cada variação pode ter uma imagem principal (`is_primary`)
4. **Fallback**: Se variação não tiver vínculos, usa todas as imagens do produto
5. **Default**: Uma variação deve ser marcada como `is_default`

## Próximos Passos (Opcional)

- [ ] Migrar produtos V1 para V2 (conversão de `product_variant_images`)
- [ ] Remover tabela `product_variant_images` após migração
- [ ] Adicionar suporte a upload de imagens diretamente no diálogo de vínculos
- [ ] Implementar drag-and-drop para reordenar imagens na galeria
- [ ] Adicionar preview de imagens no diálogo de vínculos
- [ ] Melhorar RLS baseado em roles
