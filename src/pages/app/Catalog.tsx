import React, { useEffect, useState } from 'react';
import { productsService, Product } from '@/services/productsService';
import { categoriesService, Category } from '@/services/categoriesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsService.listAllProducts(),
      categoriesService.listCategories(),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData);
        setCategories(categoriesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Helper seguro para formatar preço
  const formatPrice = (product: Product): string => {
    const price = product.price ?? product.metadata?.price ?? null;
    if (price === null || price === undefined) {
      return 'Preço sob consulta';
    }
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'Preço sob consulta' : `R$ ${numPrice.toFixed(2)}`;
  };

  if (loading) return <div className="p-8">Carregando catálogo...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <Button>
          <Plus size={16} className="mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Categories Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat.id} variant="secondary">
              {cat.name} ({cat.slug})
            </Badge>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma categoria criada</p>
          )}
        </div>
      </div>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-600">
                  {formatPrice(product)}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              {product.categories && product.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {product.categories.map((cat) => (
                    <Badge key={cat.id} variant="outline" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum produto cadastrado
        </div>
      )}
    </div>
  );
};

export default Catalog;