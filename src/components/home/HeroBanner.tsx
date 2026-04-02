import { supabase } from '@/core/supabaseClient';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  title?: string | null;
  highlightWord?: string | null;
  imageUrl?: string | null;
}

const DEFAULT_TITLE = 'Porque a sua casa merece o melhor.';
const DEFAULT_HIGHLIGHT = 'merece o melhor.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80';

const HeroBanner = ({ title, highlightWord, imageUrl }: HeroBannerProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const finalTitle = title?.trim() ? title.trim() : DEFAULT_TITLE;
  const finalHighlight = highlightWord?.trim() ? highlightWord.trim() : DEFAULT_HIGHLIGHT;
  const finalImageUrl = imageUrl?.trim() ? imageUrl.trim() : DEFAULT_IMAGE;

  useEffect(() => {
    const loadWhatsappNumber = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'store_whatsapp_e164')
        .single();

      if (error) {
        console.error('Erro ao carregar WhatsApp da loja:', error);
        return;
      }

      setWhatsappNumber(data?.value || '');
    };

    loadWhatsappNumber();
  }, []);

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) {
      console.error('WhatsApp da loja não configurado.');
      return;
    }

    const normalized = whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(
      'Oi, eu estava navegando pelo site e gostaria de ajuda.'
    );

    window.open(`https://wa.me/${normalized}?text=${message}`, '_blank');
  };

  const hasHighlight =
    finalHighlight.length > 0 && finalTitle.includes(finalHighlight);

  const renderTitle = () => {
    if (!hasHighlight) {
      return finalTitle;
    }

    const parts = finalTitle.split(finalHighlight);

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="text-green-400">{finalHighlight}</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="relative h-[600px] md:h-[700px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${finalImageUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {renderTitle()}
          </h1>

          <p className="text-lg md:text-xl text-gray-200">
            Atendimento personalizado com o Nas e suporte do nosso time de consultores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/catalog">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all"
              >
                Ver Catálogo
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>

            <Link to="/sobre">
              <Button
                size="lg"
                className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all"
              >
                <Phone size={20} className="mr-2" />
                Nossa História
              </Button>
            </Link>

            <Button
              size="lg"
              className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all"
              onClick={handleWhatsAppClick}
            >
              <Phone size={20} className="mr-2" />
              Falar com o Nas
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-8">
            <div className="flex items-center gap-2 text-white">
              <Phone size={20} className="text-green-400" />
              <span className="font-medium">Atendimento Personalizado</span>
            </div>

            <div className="w-px h-8 bg-white/30"></div>

            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <span className="font-medium">Qualidade Garantida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;