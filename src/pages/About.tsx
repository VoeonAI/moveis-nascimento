import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageCircle, 
  ChevronRight, 
  Calendar, 
  Star, 
  Heart, 
  Target, 
  Eye, 
  Award,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const About = () => {
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  // WhatsApp configuration
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);

  // Load store WhatsApp
  useEffect(() => {
    const loadStoreWhatsApp = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'store_whatsapp_e164')
          .maybeSingle();

        if (error) {
          console.warn('[About] Failed to load store WhatsApp:', error.message);
          setStoreWhatsApp(null);
          return;
        }

        if (data?.value && /^\d{10,15}$/.test(data.value)) {
          setStoreWhatsApp(data.value);
        } else {
          setStoreWhatsApp(null);
        }
      } catch (error) {
        console.warn('[About] Error loading store WhatsApp:', error);
        setStoreWhatsApp(null);
      }
    };
    loadStoreWhatsApp();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (modalOpen) {
      setFormData({ name: '', phone: '', message: '' });
    }
  }, [modalOpen]);

  const handleContactClick = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setFormData({ name: '', phone: '', message: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Por favor, informe seu nome');
      return;
    }

    if (!formData.phone.trim()) {
      showError('Por favor, informe seu telefone');
      return;
    }

    // Build WhatsApp message for general contact
    const lines = [
      'Olá! Gostaria de saber mais sobre a Móveis Nascimento.',
      '',
      'Meus dados:',
      `• Nome: ${formData.name}`,
      `• Telefone: ${formData.phone}`,
    ];
    
    if (formData.message.trim()) {
      lines.push(`• Mensagem: ${formData.message}`);
    }

    const message = lines.join('\n');

    // 1. Abrir WhatsApp imediatamente
    if (storeWhatsApp) {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } else {
      showError('WhatsApp da loja não configurado');
    }

    // 2. Fechar modal
    setModalOpen(false);

    // 3. Registrar lead em background (best-effort)
    supabase.functions.invoke('interest_create', {
      body: {
        product_id: null,
        name: formData.name,
        phone: formData.phone,
        message: `Contato via página Sobre Nós. ${formData.message}`,
        source: 'site',
        page_url: window.location.href,
      },
    }).then(({ data, error }) => {
      if (error) {
        console.error('[About] Background lead creation failed:', error);
      } else if (!data?.ok) {
        console.warn('[About] Lead creation returned error:', data);
      } else {
        console.log('[About] Lead created success');
      }
    }).catch((err) => {
      console.error('[About] Lead creation exception:', err);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Institucional */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80')] bg-cover bg-center"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Mais de <span className="text-green-400">40 anos</span>{' '}
              transformando casas em lares
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Uma história de paix, amor e dedicação que começou na cidade de Extrema e conquistou o coração de milhares de famílias.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/catalog">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl">
                  Ver Catálogo
                  <Sparkles size={20} className="ml-2" />
                </Button>
              </Link>
              <Button
                onClick={handleContactClick}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg font-semibold rounded-xl"
              >
                <MessageCircle size={20} className="mr-2" />
                Falar com o Nas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline da História */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nossa História
            </h2>
            <p className="text-gray-600 text-lg">
              A jornada da Móveis Nascimento ao longo das décadas
            </p>
          </div>

          <div className="relative">
            {/* Linha central */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-green-200"></div>

            {/* Eventos */}
            <div className="space-y-16">
              {/* Década de 80 - História do Sofá */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-12 text-right">
                  <div className="inline-block bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-green-700">
                      <Calendar size={24} />
                      <span className="font-bold text-lg">Década de 80</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      O Início: A Arte do Sofá
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Começamos nossa jornada na arte de sofazeria, criando peças únicas que contavam histórias e traziam conforto para os lares de Extrema. Cada móvel era feito à mão com o máximo de cuidado e dedicação.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-600 ring-4 ring-green-200"></div>
              </div>

              {/* 1983 - Inauguração */}
              <div className="relative flex items-center">
                <div className="w-1/2 pl-12">
                  <div className="inline-block bg-gradient-to-br from-yellow-50 to-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-yellow-700">
                      <Award size={24} />
                      <span className="font-bold text-lg">1983</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Primeira Loja
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Inauguramos nossa primeira loja física em Extrema, tornando nossos sonhos realidade. Foi o início de uma trajetória de crescimento baseada na confiança e qualidade dos nossos produtos.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-yellow-500 ring-4 ring-yellow-200"></div>
              </div>

              {/* Reinvenção - Jonas assume gestão */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-12 text-right">
                  <div className="inline-block bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-blue-700">
                      <Star size={24} />
                      <span className="font-bold text-lg">Novo Capítulo</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Reinvenção
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Com a assumir a gestão, Jonas trouxe nova visão e modernização para a empresa. Investimos em design contemporâneo, novos materiais e tecnologias de produção, mantendo sempre a qualidade que nos define.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-200"></div>
              </div>

              {/* 2008 - Filial Extrema */}
              <div className="relative flex items-center">
                <div className="w-1/2 pl-12">
                  <div className="inline-block bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-purple-700">
                      <Target size={24} />
                      <span className="font-bold text-lg">2008</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Expansão
                    </h3>
                    <p className="text-gray-600 leveading-relaxed">
                      Com o sucesso de nossa jornada, inauguramos nossa filial em Extrema, trazendo nossos produtos ainda mais perto de você. Um marco importante no crescimento da empresa.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-600 ring-4 ring-purple-200"></div>
              </div>

              {/* Hoje - 40+ anos */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-12 text-right">
                  <div className="inline-block bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-emerald-700">
                      <Heart size={24} />
                      <span className="font-bold text-lg">Hoje</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Mais de 40 Anos de História
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Hoje, continuamos a mesma tradição de qualidade e atendimento humanizado, combinando com a modernidade e inovação. Milhares de famílias confiaram em nós para transformar suas casas em lares.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-200 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nosso Diferencial */}
      <section className="py-24 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nosso Diferencial
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              O que nos torna únicos no mercado de móveis planejados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Atendimento Consultivo
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Não vendemos apenas móveis — entregamos soluções. Nossa equipe de consultores trabalha com você para entender suas necessidades e propor o móvel perfeito para cada ambiente.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Personalização Total
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Cada projeto é único. Criamos móveis personalizados que se encaixam perfeitamente no seu espaço e no seu estilo. Cores, materiais e medidas sob medida.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Award size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Qualidade Garantida
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Trabalhamos apenas com materiais de primeira linha e contamos com garantia estendida em todos os produtos. Satisfação é nossa prioridade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Missão, Visão e Valores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg border-t-4 border-green-500">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Target size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Missão
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Transformar casas em lares através de móveis planejados de alta qualidade, oferecendo atendimento personalizado que supera expectativas.
              </p>
            </div>

            {/* Visão */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border-t-4 border-blue-500">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Eye size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Visão
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Ser referência em móveis planejados na região, reconhecidos pela qualidade, inovação e atendimento humanizado que coloca o cliente em primeiro lugar.
              </p>
            </div>

            {/* Valores */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border-t-4 border-purple-500">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Heart size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Valores
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Compromisso com a qualidade, transparência em cada processo, respeito pelo cliente e paixão pelo que fazemos. Cada móvel é feito com amor e dedicação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Encerramento Emocional */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <img 
              src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Mascote%203D%20-%20Moveis%20Nascimento.png"
              alt="Mascote Nas"
              className="h-32 w-auto mx-auto"
            />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Sua casa merece ser tratada como um lar.
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Há mais de 40 anos, ajudamos famílias a criar espaços onde vivem os melhores momentos. Cada móvel que fabricamos carrega um pouco dessa nossa história e do nosso compromisso com você.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/catalog">
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
              >
                <Sparkles size={20} className="mr-2" />
                Ver Catálogo
              </Button>
            </Link>
            <Button
              onClick={handleContactClick}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg font-semibold rounded-xl"
            >
              <MessageCircle size={20} className="mr-2" />
              Falar com o Nas
            </Button>
          </div>
        </div>
      </section>

      {/* Modal de Contato */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fale Conosco</DialogTitle>
            <DialogDescription>
              Deixe seus dados e entraremos em contato o mais rápido possível.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome *</Label>
              <Input
                id="contact_name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone (WhatsApp) *</Label>
              <Input
                id="contact_phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_message">Mensagem</Label>
              <Textarea
                id="contact_message"
                placeholder="Como podemos te ajudar?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    Enviando...
                  </>
                ) : (
                  'Enviar Mensagem'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default About;