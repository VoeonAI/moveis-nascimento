import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroBanner = () => {
  return (
    <section className="relative bg-gradient-to-br from-[#FAFAF8] via-[#F5F5F0] to-[#E8E8E0] overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                Porque a sua casa{' '}
                <span className="text-green-600">merece o melhor.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl">
                Atendimento rápido e personalizado com o Nas e suporte do nosso time de consultores.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/catalog">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-green-200 transition-all"
                >
                  Ver Catálogo
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-lg font-semibold rounded-xl transition-all"
              >
                Consultar Condições
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={20} className="text-green-600" />
                <span className="font-medium">Atendimento Humanizado</span>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
                <span className="font-medium">Qualidade Garantida</span>
              </div>
            </div>
          </div>

          {/* Image/Visual Content */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 shadow-2xl shadow-green-200">
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white rounded-lg"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 border-2 border-white rounded-lg"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full"></div>
              </div>

              {/* Main Visual - Placeholder for Furniture Image */}
              <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="w-32 h-32 mx-auto bg-white/30 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-2xl font-semibold">Móveis Planejados</p>
                  <p className="text-white/80">Sob Medida</p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-orange-200 animate-bounce">
                20% OFF
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;