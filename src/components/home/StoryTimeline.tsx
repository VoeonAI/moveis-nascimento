import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Award, Target, MapPin, Home } from 'lucide-react';

interface StoryEvent {
  year: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const stories: StoryEvent[] = [
  {
    year: 'Década de 80',
    title: 'Início dos anos 80',
    subtitle: 'O sofá no teto do carro',
    description: 'João Batista Nascimento morava em São Paulo quando percebeu uma oportunidade onde muitos não viam valor. Em frente a uma pensão havia um sofá descartado. Ele lembrou que um conhecido precisava de um estofado para a guarita onde trabalhava. Com criatividade, colocou o sofá no teto de sua Brasília, amarrou com um lençol e uma corda de vassoura e levou até o comprador. A venda deu certo — e ali nasceu a ideia do negócio.',
    image: 'https://images.unsplash.com/photo-1552519508-5291?w=800&q=80',
    icon: <Calendar className="w-6 h-6 text-green-600" />,
  },
  {
    year: '1983',
    title: '17 de janeiro de 1983',
    subtitle: 'Primeira loja',
    description: 'Foi inaugurada oficialmente a primeira loja da Móveis Nascimento em Joanópolis. Um negócio familiar construído com trabalho, dedicação e proximidade com os clientes.',
    image: 'https://images.unsplash.com/photo-1441986320957-4d0b-901c-1b46a1948ce1?w=800&q=80',
    icon: <Award className="w-6 h-6 text-yellow-600" />,
  },
  {
    year: 'Reinvenção',
    title: 'Período de desafios',
    subtitle: 'Reinvenção',
    description: 'A empresa passou por momentos difíceis e precisou se reinventar. Quando a continuidade parecia incerta, a família decidiu seguir em frente. Jonas, filho de João, assumiu a gestão e iniciou a reconstrução da confiança com clientes e parceiros.',
    image: 'https://images.unsplash.com/photo-1511895426168-d20afbc7cae?w=800&q=80',
    icon: <Target className="w-6 h-6 text-blue-600" />,
  },
  {
    year: '2008',
    title: '2008',
    subtitle: 'Expansão',
    description: 'Inauguração da filial em Extrema - MG, marcando uma nova fase de crescimento.',
    image: 'https://images.unsplash.com/photo-1524661135-8451-5f8b-2c10d29346f3?w=800&q=80',
    icon: <MapPin className="w-6 h-6 text-purple-600" />,
  },
  {
    year: 'Hoje',
    title: 'Hoje',
    subtitle: 'Mais de 40 anos de história',
    description: 'Mais de quatro décadas de tradição, construídas com trabalho honesto, respeito e compromisso com os clientes. Uma história que começou com um sofá no teto de um carro — e continua sendo escrita todos os dias.',
    image: 'https://images.unsplash.com/photo-1600596547499-2e429c5bddd?w=800&q=80',
    icon: <Home className="w-6 h-6 text-green-600" />,
  },
];

const StoryTimelineItem = ({ 
  story, 
  index, 
  isLeft 
}: { 
  story: StoryEvent; 
  index: number; 
  isLeft: boolean; 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={itemRef}
      className={`relative flex justify-between items-center w-full mb-16 md:mb-24 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Content Card */}
      <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          {/* Year Badge */}
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              {story.icon}
            </div>
            <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
              {story.year}
            </span>
          </div>

          {/* Title & Subtitle */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {story.title}
          </h3>
          <p className="text-sm md:text-base text-green-600 font-medium mb-4">
            {story.subtitle}
          </p>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            {story.description}
          </p>
        </div>
      </div>

      {/* Timeline Dot (Desktop) */}
      <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
      </div>

      {/* Image (Desktop) */}
      <div className={`hidden md:block w-5/12 ${isLeft ? 'order-first' : 'order-last'}`}>
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 aspect-[4/3]">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export const StoryTimeline = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Nossa História
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Uma jornada de paixão, amor e dedicação que transformou casas em lares
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical Line (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-200 via-green-300 to-green-200"></div>

          {/* Timeline Items */}
          <div className="space-y-0">
            {stories.map((story, index) => (
              <div key={index} className="md:hidden">
                {/* Mobile Layout: Stacked */}
                <div className="relative pl-12 pb-12 border-l-2 border-green-200">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-4">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        {story.icon}
                      </div>
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                        {story.year}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-green-600 font-medium mb-2">
                      {story.subtitle}
                    </p>
                  </div>

                  <div className="relative rounded-xl overflow-hidden shadow-md border border-gray-200 aspect-[16/9]">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-gray-600 leading-relaxed text-sm mt-4">
                    {story.description}
                  </p>
                </div>
              </div>

              {/* Desktop Layout: Alternating */}
              <div className="hidden md:block">
                <StoryTimelineItem 
                  story={story} 
                  index={index} 
                  isLeft={index % 2 === 0} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};