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
import { Loader2, Copy, MessageCircle, AlertCircle } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // WhatsApp configuration (loaded directly with anon context)
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  // Load store WhatsApp directly (anon context)
  const loadStoreWhatsApp = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'store_whatsapp_e164')
        .maybeSingle();

      if (error) {
        console.warn('[ProductDetail] Failed to load store WhatsApp:', error.message);
        setStoreWhatsApp(null);
        return;
      }

      // Only consider configured if value exists and has digits
      if (data?.value && /^\d{10,15}$/.test(data.value)) {
        setStoreWhatsApp(data.value);
      } else {
        setStoreWhatsApp(null);
      }
    } catch (error) {
      console.warn('[ProductDetail] Error loading store WhatsApp:', error);
      setStoreWhatsApp(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      productsService.getProductById(id),
      loadStoreWhatsApp(),
    ])
      .then(([productData]) => {
        setProduct(productData);
      })
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

  const buildWhatsAppMessage = (): string => {
    const lines: string[] = [];
    
    lines.push(`*Tenho interesse neste produto:*`);
    lines.push(`📦 ${product?.name}`);
    lines.push(`🔗 Link: ${window.location.href}`);
    
    if (formData.message) {
      lines.push(`\n*Mensagem:*`);
      lines.push(formData.message);
    }
    
    lines.push(`\n*Meus dados:*`);
    lines.push(`👤 Nome: ${formData.name}`);
    if (formData.phone) {
      lines.push(`📱 Telefone: ${formData.phone}`);
    }
    
    return lines.join('\n');
  };

  const handleOpenWhatsApp = () => {
    if (!storeWhatsApp) {
      showError('WhatsApp da loja não configurado');
      return;
    }

    const message = buildWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showSuccess('Abrindo WhatsApp...');
    handleModalClose();
  };

  const handleCopyMessage = async () => {
    const message = buildWhatsAppMessage();
    
    try {
      await navigator.clipboard.writeText(message);
      showSuccess('Mensagem copiada! Cole no WhatsApp da loja.');
    } catch (error) {
      console.error('[ProductDetail] Failed to copy message:', error);
      showError('Erro ao copiar mensagem');
    }
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
      console.log('[ProductDetail] Sending interest request:', {
        product_id: product?.id,
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
      });

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

      // Logar resposta completa para debug
      console.log('[ProductDetail] Response:', { data, error });

      if (error) {
        // Erro estruturado do Supabase
        console.error('[ProductDetail] Supabase error:', {
          name: error.name,
          status: error.status,
          message: error.message,
          details: error.details,
          context: error.context,
        });
        
        // Tentar extrair mensagem mais detalhada
        const errorMessage = error.message || error.details || 'Erro ao registrar interesse';
        showError(errorMessage);
        return;
      }

      if (!data?.ok) {
        // Erro retornado pela função (data.ok = false)
        console.error('[ProductDetail] Function returned error:', data);
        const errorMessage = data.message || data.error || 'Erro ao registrar interesse';
        showError(errorMessage);
        return;
      }

      // Sucesso - mostrar modal com opções de WhatsApp
      // O modal permanece aberto para permitir ação de WhatsApp
      showSuccess('Interesse registrado com sucesso!');
      
    } catch (error) {
      console.error('[ProductDetail] Unexpected error:', error);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Informar Interesse</DialogTitle>
            <DialogDescription>
              Deixe seus dados e entraremos em contato.
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

          {/* WhatsApp Actions - only show after successful submission */}
          {!submitting && (
            <div className="mt-6 pt-6 border-t">
              {storeWhatsApp ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleOpenWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <MessageCircle size={20} className="mr-2" />
                    Abrir WhatsApp
                  </Button>
                  <Button
                    onClick={handleCopyMessage}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Copy size={20} className="mr-2" />
                    Copiar Mensagem
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleCopyMessage}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Copy size={20} className="mr-2" />
                    Copiar Mensagem
                  </Button>
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>
                      O WhatsApp da loja ainda não foi configurado. Copie a mensagem e envie manualmente, 
                      ou entre em contato com a loja por outro canal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;