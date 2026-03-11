import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductCard from '../products/ProductCard';
import { productsService, Product } from '@/services/productsService';

const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productsService.listAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('[ProductGrid] Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeType = (product: Product): 'featured' | 'promotion' | 'none' => {
    if (product.featured) return 'featured';
    if (product.on_promotion) return 'promotion';
    return 'none';
  };

  const filteredProducts = selectedFilter === 'all'
    ? products
    : products.filter(p => 
        p.categories?.some(cat => cat.slug === selectedFilter)
      );

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Nossos produtos</h2>
          <p className="text-gray-600 mt-2">Explore todo o catálogo</p>
        </div>
        
        {/* Filter Dropdown - usando slugs para filtrar corretamente */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sala">Sala</SelectItem>
              <SelectItem value="quarto">Quarto</SelectItem>
              <SelectItem value="cozinha">Cozinha</SelectItem>
              <SelectItem value="escritorio">Escritório</SelectItem>
              <SelectItem value="infantil">Infantil</SelectItem>
              <SelectItem value="multiuso">Multiuso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Grid de Produtos - limitado a 8 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                showBadge={getBadgeType(product)} 
              />
            ))}
          </div>

          {/* Mensagem se não houver produtos */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-12">
        <Link 
          to="/catalog" 
          className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Ver Todo o Catálogo
          <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;