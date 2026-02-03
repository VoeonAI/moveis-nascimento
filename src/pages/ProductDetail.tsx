import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { supabase } from '@/core/supabaseClient';
import { Product } from '@/types';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    if (!id) return;
    productsService.getProductById(id)
      .then(setProduct)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleInterestClick = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setFormData({ name: '', phone: '', message: '' });
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Por favor, informe seu nome');
      return;
    }

    if (!formData.phone.trim()) {
      showError('Por favor, informe seu telefone');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('interest_create', {
        body: {
          product_id: product?.id,
          name: formData.name,
          phone: formData.phone,
          message: formData.message,
          source: 'site',
          page_url: window.location.href,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.ok) {
        showSuccess('Recebido! Vamos te chamar no WhatsApp.');
        handleModalClose();
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
            onClick={handleInterestClick}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
          >
            Tenho Interesse
          </button>
        </div>
      </div>

      {/* Modal de Interesse */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Informar Interesse</DialogTitle>
            <DialogDescription>
              Deixe seus dados e entraremos em contato pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInterestSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Alguma dúvida específica sobre o produto?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Interesse'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;