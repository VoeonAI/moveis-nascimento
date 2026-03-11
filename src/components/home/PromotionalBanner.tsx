import React from 'react';

interface PromotionalBannerProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

const PromotionalBanner = ({
  title = "Transformando sua casa em um lar",
  subtitle = "Mais de 20 anos de experiência em móveis planejados de alta qualidade",
  backgroundImage
}: PromotionalBannerProps) => {
  return (
    <section className="py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div 
          className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-10 md:p-12 text-white text-center relative overflow-hidden"
          style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {/* Overlay if background image exists */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-700/90 to-green-600/90"></div>
          )}
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">{subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;