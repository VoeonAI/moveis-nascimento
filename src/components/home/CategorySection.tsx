import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  {
    id: 'sala',
    name: 'Sala',
    slug: 'sala',
    image: 'https://images.unsplash.com/photo-1588082255003-1a93643ecf59?q=80&w=2127&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    slug: 'quarto',
    image: 'https://images.unsplash.com/photo-1744974256549-8ece7cdb5dd2?q=80&w=2059&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    slug: 'cozinha',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1268&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    slug: 'escritorio',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
  },
  {
    id: 'quarto-infantil-juvenil',
    name: 'Infantil',
    slug: 'quarto-infantil-juvenil',
    image: 'https://images.unsplash.com/photo-1613685301918-59b1039422cc?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=80',
  },
  {
    id: 'area-de-servico-multiuso',
    name: 'Multiuso',
    slug: 'area-de-servico-multiuso',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80',
  },
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

      {/* All Categories Dropdown with Subcategories */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Categorias completas:</span>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              
              <SelectGroup>
                <SelectLabel>Sala</SelectLabel>
                <SelectItem value="sala">Sala</SelectItem>
                <SelectItem value="sala-de-jantar">Sala de jantar</SelectItem>
                <SelectItem value="sofas">Sofás</SelectItem>
                <SelectItem value="rack-bancada">Rack / Bancada</SelectItem>
                <SelectItem value="estante-home">Estante / Home</SelectItem>
                <SelectItem value="mesa-de-centro">Mesa de Centro</SelectItem>
                <SelectItem value="mesa-lateral-apoio">Mesa Lateral / Apoio</SelectItem>
                <SelectItem value="aparadores">Aparadores</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Quarto</SelectLabel>
                <SelectItem value="quarto">Quarto</SelectItem>
                <SelectItem value="guarda-roupas">Guarda-roupas</SelectItem>
                <SelectItem value="camas">Camas</SelectItem>
                <SelectItem value="criado-mudo">Criado-mudo</SelectItem>
                <SelectItem value="comodas">Cômodas</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Cozinha</SelectLabel>
                <SelectItem value="cozinha">Cozinha</SelectItem>
                <SelectItem value="armarios-de-cozinha">Armários de Cozinha</SelectItem>
                <SelectItem value="mesa-de-cozinha">Mesa de Cozinha</SelectItem>
                <SelectItem value="banquetas">Banquetas</SelectItem>
                <SelectItem value="cozinha-modulada">Cozinha Modulada</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Escritório</SelectLabel>
                <SelectItem value="escritorio">Escritório</SelectItem>
                <SelectItem value="escrivaninha">Escrivaninha</SelectItem>
                <SelectItem value="cadeira-de-escritorio">Cadeira de Escritório</SelectItem>
                <SelectItem value="armario-arquivo">Armário / Arquivo</SelectItem>
                <SelectItem value="estante-prateleira">Estante / Prateleira</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Infantil</SelectLabel>
                <SelectItem value="quarto-infantil-juvenil">Quarto Infantil</SelectItem>
                <SelectItem value="camas-infantil">Camas Infantil</SelectItem>
                <SelectItem value="guarda-roupas-infantil">Guarda-roupas Infantil</SelectItem>
                <SelectItem value="bercos">Berços</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>Outros</SelectLabel>
                <SelectItem value="area-de-servico-multiuso">Área de Serviço</SelectItem>
                <SelectItem value="area-externa">Área Externa</SelectItem>
                <SelectItem value="bikes-bicicleta">Bikes / Bicicleta</SelectItem>
                <SelectItem value="colchoes">Colchões</SelectItem>
                <SelectItem value="tapetes">Tapetes</SelectItem>
                <SelectItem value="modulados">Modulados</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;