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
  Sparkles,
  Phone,
  Clock,
  Shield,
  Wrench
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { StoryTimeline } from '@/components/home/StoryTimeline';

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
      {/* Hero Institucional Premium */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80')] bg-cover bg-center"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-600/30">
              <Sparkles size={16} />
              <span>Desde 1983</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Mais de <span className="text-green-400">40 anos</span>{' '}
              transformando casas em lares
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Uma história de paixão, amor e dedicação que começou na cidade de Extrema e conquistou o coração de milhares de famílias.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/catalog">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all">
                  <Sparkles size={20} className="mr-2" />
                  Ver Catálogo
                </Button>
              </Link>
              <Button
                onClick={handleContactClick}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg font-semibold rounded-xl transition-all"
              >
                <MessageCircle size={20} className="mr-2" />
                Falar com o Nas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Story Timeline - NOVO COMPONENTE */}
      <StoryTimeline />

      {/* Nosso Diferencial - Premium */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nosso Diferencial
            </h2>
            <p className="text-gray-600 text-lg">
              O que nos torna únicos no mercado de móveis planejados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-green-100">
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

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-blue-100">
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

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-purple-100">
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

      {/* Missão, Visão e Valores - Premium */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Missão, Visão e Valores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-green-500 hover:shadow-xl transition-all">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-blue-500 hover:shadow-xl transition-all">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-purple-500 hover:shadow-xl transition-all">
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

      {/* Encerramento Emocional Premium */}
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
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all"
              >
                <Sparkles size={20} className="mr-2" />
                Ver Catálogo
              </Button>
            </Link>
            <Button
              onClick={handleContactClick}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg font-semibold rounded-xl transition-all"
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