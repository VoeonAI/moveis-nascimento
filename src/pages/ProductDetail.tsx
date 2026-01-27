import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { crmService } from '@/services/crmService';
import { Product } from '@/types';
import { showSuccess } from '@/utils/toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    productsService.getProductById(id)
      .then(setProduct)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleInterest = async () => {
    if (!product) return;
    
    // Simulated user data for MVP (in real app, would ask for input)
    const leadData = {
      name: 'Cliente Interessado',
      email: 'cliente@exemplo.com',
      phone: '11999999999',
      product_id: product.id,
    };

    try {
      await crmService.createLeadFromInterest(leadData);
      showSuccess('Interesse registrado! Nossa IA entrará em contato.');
    } catch (error) {
      console.error(error);
      showSuccess('Erro ao registrar interesse (verifique console).'); // Using success toast as fallback for visibility
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!product) return <div className="p-8 text-center">Produto não encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <div className="w-full h-64 bg-gray-200 rounded mb-6 flex items-center justify-center text-gray-500">
          Imagem do Produto
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>
        
        <div className="flex items-center justify-between border-t pt-6">
          <span className="text-3xl font-bold text-green-600">
            R$ {product.price.toFixed(2)}
          </span>
          <button 
            onClick={handleInterest}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
          >
            Tenho Interesse
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;