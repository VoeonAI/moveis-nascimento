import { supabase } from '@/core/supabaseClient';
import React, { useEffect, useState } from 'react';
import { CheckCircle, MessageCircle, ShoppingBag, UserCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HowToBuySection = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');

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

  const steps = [
    {
      icon: <ShoppingBag size={32} className="text-green-600" />,
      title: 'Escolha o produto',
      description: 'Navegue pelo catálogo e encontre o móvel perfeito',
    },
    {
      icon: <CheckCircle size={32} className="text-blue-600" />,
      title: 'Clique em "Gostei"',
      description: 'Marque seus produtos favoritos para começar',
    },
    {
      icon: <MessageCircle size={32} className="text-purple-600" />,
      title: 'Fale com o Nas',
      description: 'Tire dúvidas rapidamente pelo WhatsApp',
    },
    {
      icon: <UserCheck size={32} className="text-orange-600" />,
      title: 'Compre com o consultor',
      description: 'Finalize sua compra com segurança e garantia',
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          {/* Mascote */}
          <div className="mb-6">
            <img 
              src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Mascote%203D%20-%20Moveis%20Nascimento.png"
              alt="Mascote Móveis Nascimento"
              className="h-32 mx-auto"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Como comprar</h2>
          <p className="text-gray-600 mt-2">Simples, rápido e personalizado</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={handleWhatsAppClick}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            <Phone size={20} className="mr-2" />
            Fale com o Nas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowToBuySection;