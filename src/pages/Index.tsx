import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { Product } from '@/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Package } from 'lucide-react';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    productsService.listPublicProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando catálogo...</div>;

  if (products.length === 0) {
    const canManageCatalog = profile?.role === 'master' || profile?.role === 'gestor';
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Nenhum produto cadastrado ainda</h1>
            <p className="text-gray-600 mb-6">
              O catálogo está vazio no momento.
            </p>
            {canManageCatalog && (
              <Link 
                to="/app/catalog"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Ir para Catálogo
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Catálogo de Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4 h-20 overflow-hidden">{product.description}</p>
            {product.categories && product.categories.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1">
                {product.categories.map((cat) => (
                  <span key={cat.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
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