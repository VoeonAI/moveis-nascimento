import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService, Product } from '@/services/productsService';
import { ArrowRight, Star } from 'lucide-react';
import ProductCard from '../products/ProductCard';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    try {
      const data = await productsService.listAllProducts();
      const featuredProducts = data.filter(p => p.featured === true);
      setProducts(featuredProducts);
    } catch (error) {
      console.error('[FeaturedProducts] Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Produtos em destaque</h2>
            <p className="text-gray-600 mt-2">Nossos favoritos selecionados para você</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star size={16} fill="currentColor" />
            Selecionados para você
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Produtos em destaque</h2>
          <p className="text-gray-600 mt-2">Nossos favoritos selecionados especialmente para você</p>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showBadge="featured" />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/catalog" className="inline-flex items-center gap-2 bg-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
            Ver Catálogo Completo
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;