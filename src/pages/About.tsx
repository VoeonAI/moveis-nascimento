import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Car,
  Store,
  RefreshCw,
  MapPin,
  Home
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

// Story Timeline Component
const StoryTimeline = () => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const timelineEvents = [
    {
      id: 1,
      year: 'Início dos anos 80',
      subtitle: 'O sofá no teto do carro',
      description: 'João Batista Nascimento morava em São Paulo quando percebeu uma oportunidade onde muitos não veriam valor. Em frente a uma pensão havia um sofá descartado. Ele lembrou que um conhecido precisava de um estofado para a guarita onde trabalhava. Com criatividade, colocou o sofá no teto de sua Brasília, amarrou com um lençol e uma corda de varal e levou até o comprador. A venda deu certo — e ali nasceu a ideia do negócio.',
      icon: Car,
      color: 'green',
      image: 'https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/historia/Brasilia.jpg'
    },
    {
      id: 2,
      year: '17 de janeiro de 1983',
      subtitle: 'Primeira loja',
      description: 'Foi inaugurada oficialmente a primeira loja da Móveis Nascimento em Joanópolis. Um negócio familiar construído com trabalho, dedicação e proximidade com os clientes.',
      icon: Store,
      color: 'yellow',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80'
    },
    {
      id: 3,
      year: 'Período de desafios',
      subtitle: 'Reinvenção',
      description: 'A empresa passou por momentos difíceis e precisou se reinventar. Quando a continuidade parecia incerta, a família decidiu seguir em frente. Jonas, filho de João, assumiu a gestão e iniciou a reconstrução da confiança com clientes e parceiros.',
      icon: RefreshCw,
      color: 'blue',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80'
    },
    {
      id: 4,
      year: '2008',
      subtitle: 'Expansão',
      description: 'Inauguração da filial em Extrema - MG, marcando uma nova fase de crescimento e consolidação da marca na região.',
      icon: MapPin,
      color: 'purple',
      image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80'
    },
    {
      id: 5,
      year: 'Hoje',
      subtitle: 'Mais de 40 anos de história',
      description: 'Mais de quatro décadas de tradição, construídas com trabalho honesto, respeito e compromisso com os clientes. Uma história que começou com um sofá no teto de um carro — e continua sendo escrita todos os dias.',
      icon: Home,
      color: 'emerald',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80'
    }
  ];

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = parseInt(entry.target.getAttribute('data-id') || '0');
            setVisibleItems((prev) => new Set([...prev, id]));
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll('[data-timeline-item]');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-600',
      text: 'text-green-700',
      dot: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'bg-yellow-500',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-600',
      text: 'text-blue-700',
      dot: 'bg-blue-500'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-600',
      text: 'text-purple-700',
      dot: 'bg-purple-500'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'bg-emerald-600',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500'
    }
  };

  return (
    <div className="relative">
      {/* Linha vertical central */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-green-200 via-green-300 to-green-200 hidden md:block"></div>

      <div className="space-y-12 md:space-y-16">
        {timelineEvents.map((event, index) => {
          const isVisible = visibleItems.has(event.id);
          const isLeft = index % 2 === 0;
          const colors = colorClasses[event.color as keyof typeof colorClasses];
          const Icon = event.icon;

          return (
            <div
              key={event.id}
              data-timeline-item
              data-id={event.id}
              className={`relative flex items-center w-full transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Mobile: linha lateral esquerda */}
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-green-200 via-green-300 to-green-200 md:hidden"></div>

              {/* Conteúdo */}
              <div className={`w-full md:w-1/2 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-lg border ${colors.border} hover:shadow-xl transition-shadow`}>
                  {/* Imagem */}
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <img 
                      src={event.image} 
                      alt={event.subtitle}
                      className="w-full h-32 md:h-40 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Header */}
                  <div className={`flex items-center gap-3 mb-3 ${colors.text} ${isLeft ? 'md:justify-end' : ''}`}>
                    <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg">{event.year}</span>
                  </div>

                  {/* Subtítulo */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {event.subtitle}
                  </h3>

                  {/* Descrição */}
                  <p className="text-gray-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Ponto na linha */}
              <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 rounded-full ring-4 ring-white shadow-md">
                <div className={`w-full h-full rounded-full ${colors.dot} ${isVisible ? 'animate-pulse' : ''}`}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const About = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);

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

    if (storeWhatsApp) {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } else {
      showError('WhatsApp da loja não configurado');
    }

    setModalOpen(false);

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
              Uma história de paixão, amor e dedicação que começou com um sofá no teto de um carro e conquistou o coração de milhares de famílias.
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

          <StoryTimeline />
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
                Temos nosso setor de modulados onde cada projeto é único. Criamos móveis personalizados que se encaixam perfeitamente no seu espaço e no seu estilo. Cores, materiais e medidas sob medida.
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