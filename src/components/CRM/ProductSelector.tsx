import React, { useState, useMemo } from 'react';
import { Product } from '@/services/productsService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X, Package } from 'lucide-react';

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductWithCategory extends Product {
  category?: ProductCategory;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
  disabled?: boolean;
}

/**
 * Seletor de produto avançado com busca e agrupamento por categoria
 */
const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProductId,
  onProductSelect,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Extrair categorias únicas dos produtos
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; count: number }>();
    
    products.forEach((product) => {
      const categories = product.categories || [];
      if (categories.length > 0) {
        const category = categories[0]; // Pega apenas a primeira categoria
        if (category?.id) {
          const existing = categoryMap.get(category.id);
          if (existing) {
            existing.count++;
          } else {
            categoryMap.set(category.id, {
              id: category.id,
              name: category.name || 'Sem categoria',
              count: 1,
            });
          }
        }
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [products]);

  // Filtrar produtos por busca e categoria
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

  // Agrupar produtos filtrados por categoria
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();

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

    // Ordenar grupos: categorias nomeadas primeiro, depois "Sem categoria"
    const sortedGroups = Array.from(grouped.entries()).sort(([idA], [idB]) => {
      if (idA === 'no-category') return 1;
      if (idB === 'no-category') return -1;
      return 0;
    });

    return sortedGroups.map(([categoryId, products]) => ({
      categoryId,
      categoryName: products[0]?.categories?.[0]?.name || 'Sem categoria',
      products,
    }));
  }, [filteredProducts]);

  // Produto selecionado
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategoryFilter(null);
  };

  const handleClearSelection = () => {
    onProductSelect('');
  };

  return (
    <div className="space-y-3">
      <Label>Produto de Interesse (opcional)</Label>

      {/* Produto selecionado */}
      {selectedProduct ? (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-blue-900 truncate">
              {selectedProduct.name}
            </div>
            {selectedProduct.categories?.[0]?.name && (
              <div className="text-sm text-blue-700">
                {selectedProduct.categories[0].name}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={disabled}
            className="text-blue-600 hover:text-blue-700"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <>
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className="pl-10 pr-10"
            />
            {(searchQuery || selectedCategoryFilter) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                disabled={disabled}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            )}
          </div>

          {/* Filtro por categoria (se houver busca) */}
          {searchQuery && categories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={selectedCategoryFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryFilter(null)}
                disabled={disabled}
                className="text-xs"
              >
                Todas ({categories.reduce((sum, cat) => sum + cat.count, 0)})
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={selectedCategoryFilter === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter(category.id)}
                  disabled={disabled}
                  className="text-xs"
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          )}

          {/* Lista de produtos agrupados */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
              </div>
            ) : (
              <div className="divide-y">
                {productsByCategory.map(({ categoryId, categoryName, products: categoryProducts }) => (
                  <div key={categoryId}>
                    {/* Header da categoria */}
                    {categoryName && (
                      <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 sticky top-0">
                        {categoryName}
                      </div>
                    )}

                    {/* Produtos da categoria */}
                    {categoryProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onProductSelect(product.id)}
                        disabled={disabled}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {product.name}
                        </div>
                        {product.categories?.[0]?.name && (
                          <div className="text-xs text-gray-500">
                            {product.categories[0].name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contador de resultados */}
          {filteredProducts.length > 0 && (
            <div className="text-xs text-gray-500">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductSelector;
