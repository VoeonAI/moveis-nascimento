import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { homeAmbiencesService, HomeAmbience } from '@/services/homeAmbiencesService';

const HomeAmbiences = () => {
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAmbiences();
  }, []);

  const loadAmbiences = async () => {
    setLoading(true);
    try {
      const data = await homeAmbiencesService.listActiveAmbiences();
      setAmbiences(data);
    } catch (error) {
      console.error('[HomeAmbiences] Failed to load ambiances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Ambientes que inspiram</h2>
            <p className="text-gray-600 mt-2">Inspire-se com projetos completos para cada espaço da sua casa</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ambiences.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Ambientes que inspiram</h2>
          <p className="text-gray-600 mt-2">Inspire-se com projetos completos para cada espaço da sua casa</p>
        </div>

        {/* Grid de Ambientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ambiences.map((ambience) => (
            <Link
              key={ambience.id}
              to={`/catalog?category=${ambience.category_slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Imagem */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={ambience.image_url}
                  alt={ambience.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Conteúdo */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{ambience.title}</h3>
                <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
                  <span className="font-medium">Ver produtos</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeAmbiences;