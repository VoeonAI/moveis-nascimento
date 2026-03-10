import React from 'react';
import { CheckCircle, MessageCircle, ShoppingBag, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowToBuyProps {
  title?: string;
  subtitle?: string;
  steps?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  ctaText?: string;
}

const defaultSteps = [
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
    description: 'Receba atendimento personalizado via WhatsApp',
  },
  {
    icon: <UserCheck size={32} className="text-orange-600" />,
    title: 'Compre com o consultor',
    description: 'Finalize sua compra com segurança e garantia',
  },
];

const HowToBuy = ({
  title = "Como comprar",
  subtitle = "Simples, rápido e personalizado",
  steps = defaultSteps,
  ctaText = "Fale com o Nas"
}: HowToBuyProps) => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5511999999999', '_blank');
  };

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
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
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowToBuy;