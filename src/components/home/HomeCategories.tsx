import React from 'react';
import { Link } from 'react-router-dom';
import { Sofa, Utensils, Bed, Briefcase, Baby } from 'lucide-react';

const categories = [
  {
    id: 'sala',
    name: 'Sala',
    icon: Sofa,
    slug: 'sala',
    color: 'from-amber-50 to-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    icon: Utensils,
    slug: 'cozinha',
    color: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    icon: Bed,
    slug: 'quarto',
    color: 'from-blue-50 to-indigo-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    icon: Briefcase,
    slug: 'escritorio',
    color: 'from-purple-50 to-pink-50',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
  },
  {
    id: 'infantil',
    name: 'Infantil',
    icon: Baby,
    slug: 'infantil',
    color: 'from-pink-50 to-rose-50',
    iconColor: 'text-pink-600',
    borderColor: 'border-pink-200',
  },
];

const HomeCategories = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">Nossas Categorias</h2>
        <p className="text-gray-600 mt-2">Encontre o móvel perfeito para cada ambiente</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          
          return (
            <Link
              key={category.id}
              to={`/catalog?category=${category.slug}`}
              className="group"
            >
              <div className={`
                relative bg-gradient-to-br ${category.color} 
                rounded-2xl p-6 
                border-2 ${category.borderColor}
                hover:shadow-lg hover:scale-105 
                transition-all duration-300
                cursor-pointer
              `}>
                {/* Icon */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 
                  bg-white rounded-xl 
                  flex items-center justify-center 
                  shadow-sm
                  group-hover:shadow-md transition-shadow
                `}>
                  <Icon size={32} className={category.iconColor} />
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  {category.name}
                </h3>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default HomeCategories;