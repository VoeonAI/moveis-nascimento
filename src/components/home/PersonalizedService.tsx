import React from 'react';
import { MessageCircle, CheckCircle, UserCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PersonalizedService = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5511999999999', '_blank');
  };

  const steps = [
    {
      icon: <CheckCircle size={32} className="text-green-600" />,
      title: 'Escolha o produto',
      description: 'Navegue pelo catálogo e encontre o móvel perfeito',
    },
    {
      icon: <Heart size={32} className="text-blue-600" />,
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
      title: 'Finalize com um consultor',
      description: 'Compre com segurança e garantia',
    },
  ];

  return (
    <section className="bg-gradient-to-br from-green-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Phone size={16} />
            Atendimento Exclusivo
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Compre com atendimento personalizado
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
            Fale com o Nas, tire dúvidas rapidamente e finalize sua compra com nosso time de consultores especializados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={handleWhatsAppClick}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <MessageCircle size={24} className="mr-3" />
            Fale com o Nas
          </Button>
          <p className="text-gray-500 mt-4 text-sm">
            Resposta rápida • Atendimento humanizado • Garantia de qualidade
          </p>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedService;