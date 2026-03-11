import React from 'react';
import { Link } from 'react-router-dom';
import HomeHeader from '@/components/home/HomeHeader';
import HeroBanner from '@/components/home/HeroBanner';
import CategorySection from '@/components/home/CategorySection';
import PromotionalBanner from '@/components/home/PromotionalBanner';
import HowToBuySection from '@/components/home/HowToBuySection';
import ProductGrid from '@/components/home/ProductGrid';
import EnvironmentsSection from '@/components/home/EnvironmentsSection';
import PopularProducts from '@/components/home/PopularProducts';
import { Card, CardContent } from '@/components/ui/card';

const HomeNew = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HomeHeader />

      {/* Hero Principal */}
      <HeroBanner />

      {/* Categorias Principais */}
      <CategorySection />

      {/* Banner Promocional (Verde) */}
      <PromotionalBanner />

      {/* Como Comprar - BLOCO UNIFICADO */}
      <HowToBuySection />

      {/* Produtos Mais Procurados/Vendidos */}
      <PopularProducts />

      {/* Produtos Destaque */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Destaques da Semana</h2>
            <p className="text-gray-600 mt-2">Confira nossas ofertas especiais</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={`https://images.unsplash.com/photo-${
                        ['1555041469-a586c61ea9bc',
                        '1616594039914-746bb0062b09',
                        '1556911220-e15b29be8c8f'
                      ][i - 1]}?w=400&q=80`}
                      alt="Destaque"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Grade de Produtos */}
      <ProductGrid />

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Móveis Nascimento</h3>
              <p className="text-gray-400">
                Transformando casas em lares desde 2004
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/catalog" className="hover:text-white">Catálogo</Link></li>
                <li><Link to="#" className="hover:text-white">Sobre Nós</Link></li>
                <li><Link to="#" className="hover:text-white">Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Categorias</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/catalog?category=sala" className="hover:text-white">Sala</Link></li>
                <li><Link to="/catalog?category=quarto" className="hover:text-white">Quarto</Link></li>
                <li><Link to="/catalog?category=cozinha" className="hover:text-white">Cozinha</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>(11) 99999-9999</li>
                <li>contato@moveisnascimento.com.br</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>© 2024 Móveis Nascimento. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeNew;