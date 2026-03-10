import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const environments = [
  {
    id: 'sala',
    name: 'Sala',
    description: 'Transforme sua sala em um espaço acolhedor e elegante',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    description: 'Crie o refúgio perfeito para suas noites de descanso',
    image: 'https://images.unsplash.com/photo-1616594039914-746bb0062b09?w=600&q=80',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    description: 'Produtividade e conforto para seu trabalho em casa',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80',
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    description: 'Organização e estilo para o coração da sua casa',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
  },
];

const EnvironmentsSection = () => {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Ambientes em Destaque</h2>
          <p className="text-gray-600 mt-2">Inspire-se com projetos completos para cada espaço da sua casa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {environments.map((env) => (
            <div key={env.id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={env.image}
                  alt={env.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{env.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{env.description}</p>
                <Link 
                  to={`/catalog?category=${env.id}`}
                  className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
                >
                  Ver ambiente
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnvironmentsSection;