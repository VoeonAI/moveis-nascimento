import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { Product } from '@/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productImagesService } from '@/services/productImagesService';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsService.listPublicProducts(
          selectedCategory !== 'all' ? { categorySlug: selectedCategory } : undefined
        ),
        categoriesService.listActiveCategories(),
      ]);
      
      setProducts(productsData);
      // Filter to show only root categories (parent_id is null)
      setCategories(categoriesData.filter((cat: any) => !cat.parent_id));
    } catch (error) {
      console.error('[Index] Load error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper seguro para obter preço
  const getPrice = (product: Product): string => {
    const price = product.price ?? product.metadata?.price ?? null;
    if (price === null || price === undefined) {
      return 'Preço sob consulta';
    }
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'Preço sob consulta' : `R$ ${numPrice.toFixed(2)}`;
  };

  if (loading) return <div className="p-8 text-center">Carregando catálogo...</div>;

  const canManageCatalog = profile?.role === 'master' || profile?.role === 'gestor';

  if (products.length === 0 && selectedCategory === 'all') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Nenhum produto cadastrado ainda</h1>
            <p className="text-gray-600 mb-6">
              O catálogo está vazio no momento.
            </p>
            {canManageCatalog && (
              <Link 
                to="/app/catalog"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Ir para Catálogo
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-center md:text-left">Catálogo de Produtos</h1>
          
          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Categoria:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum produto encontrado nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const coverPath = Array.isArray(product.images) ? product.images[0] : null;
              const coverUrl = coverPath ? productImagesService.getPublicUrl(coverPath) : '';
              
              return (
                <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-3"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center text-gray-500">
                      Imagem do Produto
                    </div>
                  )}
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <p className="text-gray-600 mb-4 h-20 overflow-hidden">{product.description}</p>
                  {product.categories && product.categories.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {product.categories.map((cat) => (
                        <span key={cat.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      {getPrice(product)}
                    </span>
                    <Link 
                      to={`/product/${product.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;