import React, { useEffect, useState } from 'react';
import { homePromoBannerService, HomePromoBanner } from '@/services/homePromoBannerService';
import { productImagesService } from '@/services/productImagesService';

const PromotionalBanner = () => {
  const [banner, setBanner] = useState<HomePromoBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const data = await homePromoBannerService.getPromoBanner();
        setBanner(data);
      } catch (error) {
        console.error('[PromotionalBanner] Failed to load banner:', error);
        setBanner(null);
      } finally {
        setLoading(false);
      }
    };

    loadBanner();
  }, []);

  if (loading) {
    return null; // Não mostrar nada enquanto carrega
  }

  if (!banner || !banner.active) {
    return null; // Não mostrar se não houver banner ativo
  }

  const imageUrl = banner.image_url ? productImagesService.getPublicUrl(banner.image_url) : '';

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          {/* Imagem */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={banner.image_alt || 'Banner Promocional'}
              className="w-full h-64 md:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Imagem não disponível</span>
            </div>
          )}

          {/* Texto sobre a imagem (se show_text = true) */}
          {banner.show_text && banner.text && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
              <p className="text-white text-xl md:text-2xl font-bold text-center leading-tight">
                {banner.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;