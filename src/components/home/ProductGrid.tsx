import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const ProductGrid = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Placeholder products - futuramente conectar com banco
  const placeholderProducts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    name: 'Produto Exemplo',
    category: ['Sala', 'Quarto', 'Cozinha', 'Escritório', 'Infantil', 'Multiuso'][i % 6],
    image: `https://images.unsplash.com/photo-${
      ['1555041469-a586c61ea9bc',
      '1616594039914-746bb0062b09',
      '1556911220-e15b29be8c8f',
      '1518455027359-f3f8164ba6bd',
      '1538688525198-9b88f6f53126',
      '1505693314120-0d443867891c',
      '1618221195710-dd6b41faaea6',
      '1556228453-9a9c0b017f2e'
    ][i]}?w=400&q=80`,
    price: 'R$ 1.999,00',
  }));

  const filteredProducts = selectedFilter === 'all'
    ? placeholderProducts
    : placeholderProducts.filter(p => 
        p.category.toLowerCase() === selectedFilter.toLowerCase()
      );

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Nossos Produtos</h2>
          <p className="text-gray-600 mt-2">Explore todo o catálogo</p>
        </div>
        
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sala">Sala</SelectItem>
              <SelectItem value="quarto">Quarto</SelectItem>
              <SelectItem value="cozinha">Cozinha</SelectItem>
              <SelectItem value="escritório">Escritório</SelectItem>
              <SelectItem value="infantil">Infantil</SelectItem>
              <SelectItem value="multiuso">Multiuso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 relative">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Overlay com botão "Gostei" */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button 
                    size="lg"
                    className="bg-white text-green-600 hover:bg-green-600 hover:text-white font-semibold px-6 py-3 rounded-lg"
                  >
                    <Heart size={20} className="mr-2" />
                    GOSTEI DESSE PRODUTO
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="mt-3 h-4 bg-gray-200 rounded w-1/3"></div>
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
  );
};

export default ProductGrid;