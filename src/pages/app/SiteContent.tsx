import React, { useEffect, useState } from 'react';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

const SiteContent = () => {
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHero = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await homeHeroService.getHomeHero();
        setHero(data);
      } catch (err) {
        console.error('[SiteContent] Erro ao carregar hero:', err);
        setError('Erro ao carregar dados do Hero');
        setHero(null);
      } finally {
        setLoading(false);
      }
    };

    loadHero();
  }, []);

  // Função para renderizar o título com highlight
  const renderTitle = () => {
    if (!hero) return '';
    
    const title = hero.title || '';
    const highlight = hero.highlight_word || '';

    if (!highlight || !title.includes(highlight)) {
      return title;
    }

    const parts = title.split(highlight);

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="text-green-400 font-bold">{highlight}</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Conteúdo do Site</h1>
      <p className="text-gray-600 text-sm mb-6">
        Gerencie o banner principal da página inicial.
      </p>

      {/* Hero Section - Preview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Preview do Banner Principal</h2>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Carregando preview...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle size={20} />
              <div>
                <p className="font-medium">Erro ao carregar Hero</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        ) : !hero ? (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum banner configurado</h3>
            <p className="text-gray-500 text-sm">
              Configure um banner na aba "Banner Principal" para ver o preview aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Hero Preview - Mesma altura que na home (600px md:700px) */}
            <div className="relative h-[600px] md:h-[700px] overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: hero.image_url ? `url('${hero.image_url}')` : 'none' }}>
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
              </div>

              {/* Conteúdo sobreposto */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-center">
                <div className="max-w-2xl space-y-6">
                  {/* Título com highlight */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    {renderTitle()}
                  </h1>

                  {/* Subtítulo fixo */}
                  <p className="text-lg md:text-xl text-gray-200">
                    Atendimento personalizado com o Nas e suporte do nosso time de consultores.
                  </p>

                  {/* Botões (visuais apenas, sem funcionalidade) */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all inline-flex items-center gap-2">
                      Ver Catálogo
                    </div>
                    <div className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all inline-flex items-center gap-2">
                      Nossa História
                    </div>
                  </div>

                  {/* Badges de confiança */}
                  <div className="flex items-center gap-6 pt-8">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-2xl">📞</span>
                      <span className="font-medium">Atendimento Personalizado</span>
                    </div>
                    <div className="w-px h-8 bg-white/30"></div>
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                      <span className="font-medium">Qualidade Garantida</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info dos dados */}
            <div className="p-6 bg-gray-50 border-t space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Título</p>
                <p className="text-sm font-medium text-gray-900">{hero.title || '<sem título>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Palavra de Destaque</p>
                <p className="text-sm font-medium text-gray-900">{hero.highlight_word || '<sem highlight>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">URL da Imagem</p>
                <p className="text-xs text-gray-600 font-mono break-all">{hero.image_url || '<sem URL>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Texto Alternativo</p>
                <p className="text-sm font-medium text-gray-900">{hero.image_alt || '<sem alt>'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteContent;