import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService, Product } from '@/services/productsService';
import { ArrowRight, Tag } from 'lucide-react';
import ProductCard from '../products/ProductCard';

const WeeklyHighlights = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotionalProducts();
  }, []);

  const loadPromotionalProducts = async () => {
    setLoading(true);
    try {
      const data = await productsService.listAllProducts();
      const promotionalProducts = data.filter(p => p.on_promotion === true);
      setProducts(promotionalProducts);
    } catch (error) {
      console.error('[WeeklyHighlights] Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Destaques da semana</h2>
            <p className="text-gray-600 mt-2">Confira nossas ofertas especiais</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
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
    <section className="py-20 bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Tag size={16} />
            Ofertas da Semana
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Destaques da semana</h2>
          <p className="text-gray-600 mt-2">Confira nossas ofertas especiais com preços imperdíveis</p>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showBadge="promotion" />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/catalog" className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
            Ver Todas as Ofertas
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WeeklyHighlights;