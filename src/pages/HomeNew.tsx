import React from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '@/components/home/HeroBanner';
import HomeCategories from '@/components/home/HomeCategories';
import { ArrowRight, CheckCircle, Truck, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HomeNew = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Principal */}
      <HeroBanner />

      {/* Categorias Principais */}
      <HomeCategories />

      {/* Banner Institucional */}
      <section className="bg-gradient-to-r from-green-700 to-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Transformando sua casa em um lar
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Mais de 20 anos de experiência em móveis planejados de alta qualidade
          </p>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Como Funciona</h2>
          <p className="text-gray-600 mt-2">Simples, rápido e sem dor de cabeça</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Escolha</h3>
            <p className="text-gray-600">Selecione os produtos para seu ambiente</p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Truck size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Entrega</h3>
            <p className="text-gray-600">Montagem e instalação inclusa</p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Shield size={32} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Garantia</h3>
            <p className="text-gray-600">5 anos de garantia em todos os produtos</p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Headphones size={32} className="text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Suporte</h3>
            <p className="text-gray-600">Atendimento especializado pós-venda</p>
          </div>
        </div>
      </section>

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
                      src={`https://images.unsplash.com/photo-${[
                        '1555041469-a586c61ea9bc',
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
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Nossos Produtos</h2>
          <p className="text-gray-600 mt-2">Explore todo o catálogo</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={`https://images.unsplash.com/photo-${[
                      '1555041469-a586c61ea9bc',
                      '1616594039914-746bb0062b09',
                      '1556911220-e15b29be8c8f',
                      '1518455027359-f3f8164ba6bd',
                      '1538688525198-9b88f6f53126',
                      '1505693314120-0d443867891c',
                      '1618221195710-dd6b41faaea6',
                      '1556228453-9a9c0b017f2e'
                    ][i - 1]}?w=400&q=80`}
                    alt="Produto"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Ver Todo o Catálogo
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

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