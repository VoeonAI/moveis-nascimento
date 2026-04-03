import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { homeAmbiencesService, HomeAmbience } from '@/services/homeAmbiencesService';
import { settingsService } from '@/services/settingsService';
import { webhooksService, WEBHOOK_EVENTS } from '@/services/webhooksService';

const HomeAmbiences = () => {
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookSendAmbienceClick, setWebhookSendAmbienceClick] = useState(false);

  useEffect(() => {
    loadAmbiences();
    loadWebhookSettings();
  }, []);

  const loadAmbiences = async () => {
    console.log('[HomeAmbiences] Carregando ambientes...');
    setLoading(true);
    setError(null);
    
    try {
      const data = await homeAmbiencesService.listActiveAmbiences();
      console.log('[HomeAmbiences] Dados recebidos:', {
        count: data.length,
        data: data,
      });
      setAmbiences(data);
    } catch (error) {
      console.error('[HomeAmbiences] Erro ao carregar:', error);
      setError('Erro ao carregar ambientes');
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookSettings = async () => {
    try {
      const [enabled, sendAmbienceClick] = await Promise.all([
        settingsService.getWebhookEnabled(),
        settingsService.getWebhookSendAmbienceClick(),
      ]);
      setWebhookEnabled(enabled);
      setWebhookSendAmbienceClick(sendAmbienceClick);
      console.log('[HomeAmbiences] Configurações de webhook:', { enabled, sendAmbienceClick });
    } catch (error) {
      console.error('[HomeAmbiences] Erro ao carregar configurações de webhook:', error);
      // Não falhar se não conseguir carregar configurações
    }
  };

  const handleAmbienceClick = async (ambience: HomeAmbience, e: React.MouseEvent) => {
    // Verificar se deve enviar webhook
    if (webhookEnabled && webhookSendAmbienceClick) {
      try {
        await webhooksService.emit(
          WEBHOOK_EVENTS.HOME_AMBIENCE_CLICK,
          {
            type: 'modulado_interest',
            ambience: ambience.title,
            message: `Oi, tenho interesse em modulados para ${ambience.title}.`,
          },
          'site',
          {
            page: 'home',
            section: 'ambiences',
            ambience_id: ambience.id,
          }
        );
        console.log('[HomeAmbiences] Webhook enviado para:', ambience.title);
      } catch (error) {
        console.error('[HomeAmbiences] Erro ao enviar webhook:', error);
        // Não impedir a navegação se o webhook falhar (best-effort)
      }
    }
  };

  console.log('[HomeAmbiences] Render:', { loading, error, ambiencesCount: ambiences.length, webhookEnabled, webhookSendAmbienceClick });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Ambientes Modulados que inspiram seu lar</h2>
          <p className="text-gray-600 mt-2">Conheça os Móveis Modulados com projetos completos e sob medida para a da sua casa</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && ambiences.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Nenhum ambiente cadastrado ainda</p>
            <p className="text-gray-500 text-sm mt-2">Em breve você verá aqui ambientes inspiracionais</p>
          </div>
        )}

        {/* Grid de Ambientes */}
        {!loading && !error && ambiences.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ambiences.map((ambience) => (
              <Link
                key={ambience.id}
                to={`/catalog?category=${ambience.category_slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
                onClick={(e) => handleAmbienceClick(ambience, e)}
              >
                {/* Imagem */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={ambience.image_url}
                    alt={ambience.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{ambience.title}</h3>
                  <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
                    <span className="font-medium">Ver produtos</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeAmbiences;