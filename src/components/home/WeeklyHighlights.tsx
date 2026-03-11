import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService, Product } from '@/services/productsService';
import { productImagesService } from '@/services/productImagesService';
import { ArrowRight, Tag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      // Filtrar produtos em promoção
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
          {products.map((product) => {
            const coverPath = Array.isArray(product.images) ? product.images[0] : null;
            const coverUrl = coverPath ? productImagesService.getPublicUrl(coverPath) : '';
            
            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* Badge de Promoção */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Tag size={12} />
                    Promoção
                  </div>
                </div>

                {/* Imagem */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* Overlay com botão */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <Button className="bg-white text-green-600 hover:bg-green-600 hover:text-white font-semibold px-6 py-2 rounded-lg shadow-lg">
                    <Heart size={18} className="mr-2" />
                    Ver Oferta
                  </Button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">Em promoção</span>
                    <span className="text-xs text-gray-500">Ver detalhes →</span>
                  </div>
                </div>
              </Link>
            );
          })}
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