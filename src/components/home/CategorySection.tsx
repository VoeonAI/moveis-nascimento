import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  {
    id: 'sala',
    name: 'Sala',
    slug: 'sala',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    slug: 'quarto',
    image: 'https://images.unsplash.com/photo-1616594039914-746bb0062b09?w=400&q=80',
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    slug: 'cozinha',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    slug: 'escritorio',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
  },
  {
    id: 'infantil',
    name: 'Infantil',
    slug: 'infantil',
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=80',
  },
  {
    id: 'multiuso',
    name: 'Multiuso',
    slug: 'multiuso',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80',
  },
];

const allCategories = [
  'Sala',
  'Sala de jantar',
  'Quarto',
  'Cozinha',
  'Escritório',
  'Infantil',
  'Multiuso',
  'Bikes',
  'Outros',
];

const CategorySection = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredCategories = selectedFilter === 'all' 
    ? categories 
    : categories.filter(cat => cat.id === selectedFilter);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">Conheça nossa loja de móveis</h2>
        <p className="text-gray-600 mt-2">Soluções completas para todos os ambientes da sua casa</p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/catalog?category=${category.slug}`}
            className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
          >
            {/* Image */}
            <div className="aspect-[3/4] bg-gray-100">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Name */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-semibold text-white text-center">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* All Categories Dropdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Categorias completas:</span>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase().replace(' ', '_')}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;