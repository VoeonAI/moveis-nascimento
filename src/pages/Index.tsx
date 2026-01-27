import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { Product } from '@/types';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService.listPublicProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando catálogo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Catálogo de Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4 h-20 overflow-hidden">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                R$ {product.price.toFixed(2)}
              </span>
              <Link 
                to={`/product/${product.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;