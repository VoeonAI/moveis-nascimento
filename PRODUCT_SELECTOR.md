# Seletor de Produto Avançado - Lead Manual

## Visão Geral

Componente avançado para seleção de produtos no modal de criação de lead manual, com busca em tempo real e agrupamento por categoria.

## Recursos

### 1. Busca por Texto
- Filtra produtos por nome (case insensitive)
- Atualização em tempo real
- Exibe contagem de resultados

### 2. Agrupamento por Categoria
- Usa categorias já existentes dos produtos
- Exibe label da categoria acima dos itens
- Ordenação alfabética das categorias
- Produtos sem categoria aparecem no final ("Sem categoria")

### 3. Filtro por Categoria
- Quando há busca, exibe botões de filtro por categoria
- Mostra contagem de produtos por categoria
- Filtro "Todas" para mostrar todos os resultados

### 4. Experiência de Seleção
- Seleção simples com clique
- Exibe produto selecionado em destaque (azul)
- Botão para limpar seleção (X)
- Campo de busca desaparece após seleção

### 5. Estados de Vazio
- Mensagem amigável quando não há produtos
- Mensagem de "nenhum produto encontrado" quando busca não retorna resultados
- Contador de resultados quando há produtos

## Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Busca** | ❌ Não disponível | ✅ Busca em tempo real |
| **Categorias** | ❌ Lista plana | ✅ Agrupado por categoria |
| **Filtros** | ❌ Não disponível | ✅ Filtro por categoria |
| **Experiência** | Dropdown simples | ✅ Seleção visual rica |
| **Escalabilidade** | ❌ Difícil com muitos produtos | ✅ Escalável |

## Implementação

### Componente: ProductSelector

Arquivo: `src/components/crm/ProductSelector.tsx`

```typescript
interface ProductSelectorProps {
  products: Product[];              // Lista de produtos disponíveis
  selectedProductId: string;        // ID do produto selecionado
  onProductSelect: (productId: string) => void;  // Callback de seleção
  disabled?: boolean;              // Desabilitar interações
}
```

### Integração no Modal

Arquivo: `src/pages/app/CRM.tsx`

```typescript
// Import
import ProductSelector from '@/components/crm/ProductSelector';

// Estado dos produtos (já existe)
const [products, setProducts] = useState<Product[]>([]);

// Carregar produtos (já existe)
useEffect(() => {
  if (newLeadModalOpen) {
    productsService.listAllProducts().then(setProducts);
  }
}, [newLeadModalOpen]);

// No modal de lead manual
<ProductSelector
  products={products}
  selectedProductId={newLeadData.product_id}
  onProductSelect={(productId) => setNewLeadData({ ...newLeadData, product_id: productId })}
  disabled={creatingLead}
/>
```

## Visualização

### Estado Inicial (Nenhum produto selecionado)

```
┌─────────────────────────────────────────────────────────────┐
│ Produto de Interesse (opcional)                             │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔍 Buscar produto...                               [×] │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Sala                                                  │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Sofá 3 Lugares                                          │  │
│ │ Poltrona                                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Quarto                                                │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Cama Casal                                               │  │
│ │ Cama Solteiro                                            │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ 8 produtos encontrados                                        │
└─────────────────────────────────────────────────────────────┘
```

### Estado com Busca

```
┌─────────────────────────────────────────────────────────────┐
│ Produto de Interesse (opcional)                             │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔍 cama                                            [×] │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ [Todas (3)] [Quarto (2)] [Sala (1)]                         │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Quarto                                                │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Cama Casal                                               │  │
│ │ Cama Solteiro                                            │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Sala                                                  │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Cama Box Casal                                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ 3 produtos encontrados                                        │
└─────────────────────────────────────────────────────────────┘
```

### Produto Selecionado

```
┌─────────────────────────────────────────────────────────────┐
│ Produto de Interesse (opcional)                             │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📦 Cama Casal                                   [×] │  │
│ │ Quarto                                                   │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Estado Vazio (Sem resultados)

```
┌─────────────────────────────────────────────────────────────┐
│ Produto de Interesse (opcional)                             │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔍 xyzabc                                         [×] │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │                    Nenhum produto encontrado             │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Lógica de Funcionamento

### 1. Extração de Categorias

```typescript
// Mapear categorias únicas dos produtos
const categories = useMemo(() => {
  const categoryMap = new Map();
  
  products.forEach((product) => {
    const category = product.categories?.[0]; // Primeira categoria
    if (category?.id) {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name || 'Sem categoria',
          count: 0,
        });
      }
      categoryMap.get(category.id).count++;
    }
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}, [products]);
```

### 2. Filtro de Produtos

```typescript
const filteredProducts = useMemo(() => {
  let result = [...products];

  // Filtro por busca (case insensitive)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    result = result.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }

  // Filtro por categoria
  if (selectedCategoryFilter) {
    result = result.filter((product) =>
      product.categories?.some(cat => cat.id === selectedCategoryFilter)
    );
  }

  return result;
}, [products, searchQuery, selectedCategoryFilter]);
```

### 3. Agrupamento por Categoria

```typescript
const productsByCategory = useMemo(() => {
  const grouped = new Map();

  // Agrupar produtos por categoria
  filteredProducts.forEach((product) => {
    const category = product.categories?.[0];
    const categoryName = category?.name || 'Sem categoria';
    const categoryId = category?.id || 'no-category';

    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, []);
    }
    grouped.get(categoryId)?.push(product);
  });

  // Ordenar: categorias nomeadas primeiro, depois "Sem categoria"
  return Array.from(grouped.entries())
    .sort(([idA], [idB]) => {
      if (idA === 'no-category') return 1;
      if (idB === 'no-category') return -1;
      return 0;
    })
    .map(([categoryId, products]) => ({
      categoryId,
      categoryName: products[0]?.categories?.[0]?.name || 'Sem categoria',
      products,
    }));
}, [filteredProducts]);
```

## Vantagens

### Para o Usuário
- ✅ Encontrar produtos rapidamente com busca
- ✅ Navegação intuitiva por categorias
- ✅ Feedback visual claro de seleção
- ✅ Experiência consistente mesmo com muitos produtos

### Para o Desenvolvedor
- ✅ Fácil de integrar (interface simples)
- ✅ Usa dados existentes (produtos e categorias)
- ✅ Sem alterações no backend
- ✅ Componente reutilizável

### Para o Negócio
- ✅ Redução de tempo na criação de leads
- ✅ Menor chance de erro humano
- ✅ Melhor qualidade de dados
- ✅ Escalável para grande volume de produtos

## Fallbacks

### 1. Produtos sem Categoria
- Produtos sem categoria aparecem no grupo "Sem categoria"
- Grupo aparece no final da lista
- Funcionalidade completa mantida

### 2. Busca Vazia
- Exibe todos os produtos agrupados
- Sem filtros de categoria quando busca está vazia

### 3. Sem Resultados
- Exibe mensagem "Nenhum produto encontrado"
- Botão para limpar busca

### 4. Produtos Vazios
- Exibe mensagem "Nenhum produto disponível"
- Interface não quebra

## Próximas Evoluções

1. **Adicionar imagens** → Miniaturas dos produtos
2. **Busca por código** → Buscar por SKU ou código interno
3. **Multi-seleção** → Permitir selecionar múltiplos produtos
4. **Sugestões** → Produtos recentemente selecionados
5. **Filtros avançados** → Por preço, disponibilidade, etc.
6. **Ordenação** → Por nome, preço, popularidade

## Notas de Implementação

- **Case insensitive**: A busca ignora maiúsculas/minúsculas
- **Trim**: Remove espaços em branco da busca
- **Ordenação**: Categorias em português (pt-BR)
- **Sticky header**: Categoria permanece fixa ao rolar
- **Max height**: Limite de 256px para lista (scrollable)
- **Lazy evaluation**: `useMemo` para performance

## Regras de Uso

✅ **NÃO alterar banco** → Usa dados existentes  
✅ **NÃO alterar relacionamento** → Usa product_categories existente  
✅ **NÃO alterar CRM** → Apenas UX do seletor  
✅ **Valor continua sendo product_id** → Sem mudança na estrutura  
✅ **Apenas melhorar UX** → Substituição de UI  
✅ **Experiência escalável** → Funciona bem com muitos produtos  
