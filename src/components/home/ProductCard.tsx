import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Tag, Heart, ArrowRight } from 'lucide-react';
import { Product } from '@/services/productsService';
import { productImagesService } from '@/services/productImagesService';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  showBadge?: 'featured' | 'promotion' | 'none';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showBadge = 'none' }) => {
  const coverPath = Array.isArray(product.images) ? product.images[0] : null;
  const coverUrl = coverPath ? productImagesService.getPublicUrl(coverPath) : '';
  
  const category = product.categories?.[0]?.name || 'Preço sob consulta';

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
    >
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Imagem com Badge */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sem imagem
            </div>
          )}

          {/* Badge */}
          {showBadge !== 'none' && (
            <div className="absolute top-3 left-3 z-10">
              {showBadge === 'featured' ? (
                <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Star size={10} fill="currentColor" />
                  Destaque
                </div>
              ) : (
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Tag size={10} />
                  Promoção
                </div>
              )}
            </div>
          )}

          {/* Overlay hover com link secundário */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="text-white text-sm font-medium flex items-center gap-1">
              Ver detalhes
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {/* Nome */}
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-base leading-snug">
            {product.name}
          </h3>

          {/* Microtexto */}
          <p className="text-xs text-gray-500 mb-3">
            {category}
          </p>

          {/* Botão principal */}
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors">
            <Heart size={16} className="mr-2" />
            Gostei desse produto
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;