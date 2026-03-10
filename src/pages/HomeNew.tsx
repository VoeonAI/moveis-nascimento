import React from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '@/components/home/HeroBanner';
import HomeCategories from '@/components/home/HomeCategories';

const HomeNew = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero Principal */}
      <HeroBanner />

      {/* Categorias Principais */}
      <HomeCategories />

      {/* Placeholder: Banner Institucional */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Transformando sua casa em um lar</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Mais de 20 anos de experiência em móveis planejados de alta qualidade
          </p>
        </div>
      </section>

      {/* Placeholder: Produtos Destaque */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Destaques da Semana</h2>
          <p className="text-gray-600 mt-2">Confira nossas ofertas especiais</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder: Como Funciona */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Como Funciona</h2>
            <p className="text-gray-600 mt-2">Simples, rápido e sem dor de cabeça</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder: Grade de Produtos */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Nossos Produtos</h2>
          <p className="text-gray-600 mt-2">Explore todo o catálogo</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link 
            to="/catalog" 
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Ver Todo o Catálogo
          </Link>
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 Móveis Nascimento. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeNew;