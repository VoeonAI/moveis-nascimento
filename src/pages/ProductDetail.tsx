import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { supabase } from '@/core/supabaseClient';
import { Product } from '@/types';
import { showSuccess, showError } from '@/utils/toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('interest_create', {
        body: {
          product_id: product.id,
          source: 'site',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.ok) {
        showSuccess('Interesse registrado! Nossa IA entrará em contato em breve.');
      } else {
        throw new Error('Failed to register interest');
      }
    } catch (error) {
      console.error('Error registering interest:', error);
      showError('Erro ao registrar interesse. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper seguro para obter preço
  const getPrice = (product: Product | null): string => {
    if (!product) return 'Preço sob consulta';
    const price = product.price ?? product.metadata?.price ?? null;
    if (price === null || price === undefined) {
      return 'Preço sob consulta';
    }
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'Preço sob consulta' : `R$ ${numPrice.toFixed(2)}`;
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
            {getPrice(product)}
          </span>
          <button 
            onClick={handleInterest}
            disabled={submitting}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Registrando...' : 'Tenho Interesse'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;