import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { supabase } from '@/core/supabaseClient';
import { Product } from '@/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, MessageCircle, AlertCircle, Star, Tag, ArrowRight } from 'lucide-react';
import { productImagesService } from '@/services/productImagesService';
import ProductCard from '@/components/products/ProductCard';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Main image state for gallery
  const [mainImage, setMainImage] = useState<string | null>(null);

  // WhatsApp configuration
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Public site URL for product links
  const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;

  // Check if user can see price
  const canSeePrice = profile?.role && [Role.MASTER, Role.GESTOR, Role.ESTOQUE].includes(profile.role);

  // Load store WhatsApp
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

  // Load related products
  const loadRelatedProducts = async (currentProduct: Product) => {
    setLoadingRelated(true);
    try {
      const allProducts = await productsService.listAllProducts();
      // Filter by same category and exclude current product
      const related = allProducts
        .filter(p => 
          p.id !== currentProduct.id &&
          p.categories?.some(cat => cat.id === currentProduct.categories?.[0]?.id)
        )
        .slice(0, 4); // Show up to 4 related products
      setRelatedProducts(related);
    } catch (error) {
      console.error('[ProductDetail] Failed to load related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
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
        // Set main image to first image
        setMainImage(Array.isArray(productData.images) && productData.images.length > 0 ? productData.images[0] : null);
        // Load related products
        loadRelatedProducts(productData);
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
    
    lines.push(`Tenho interesse neste produto:`);
    lines.push(`• Produto: ${product?.name}`);
    lines.push(`• Produto ID: ${product?.id}`);
    
    if (publicSiteUrl) {
      lines.push(`• Link: ${publicSiteUrl}/product/${product?.id}`);
    } else {
      lines.push(`• Link: (indisponível no ambiente local)`);
    }
    
    if (formData.message) {
      lines.push(``);
      lines.push(`Mensagem: ${formData.message}`);
    }
    
    lines.push(``);
    lines.push(`Meus dados:`);
    lines.push(`• Nome: ${formData.name}`);
    lines.push(`• Telefone: ${formData.phone}`);
    
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
          page_url: publicSiteUrl ? `${publicSiteUrl}/product/${product?.id}` : window.location.href,
        },
      });

      console.log('[ProductDetail] Response:', { data, error });

      if (error) {
        console.error('[ProductDetail] Supabase error:', {
          name: error.name,
          status: error.status,
          message: error.message,
          details: error.details,
        });
        
        const errorMessage = error.message || error.details || 'Erro ao registrar interesse';
        showError(errorMessage);
        return;
      }

      if (!data?.ok) {
        console.error('[ProductDetail] Function returned error:', data);
        const errorMessage = data.message || data.error || 'Erro ao registrar interesse';
        showError(errorMessage);
        return;
      }

      showSuccess('Interesse registrado com sucesso!');

      if (storeWhatsApp) {
        const message = buildWhatsAppMessage();
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        handleModalClose();
      } 
      
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

  // Get main image URL
  const mainImageUrl = mainImage ? productImagesService.getPublicUrl(mainImage) : '';

  // Get gallery images (excluding main)
  const galleryImages = Array.isArray(product.images) && product.images.length > 1
    ? product.images.filter((img) => img !== mainImage).map((img) => ({
        path: img,
        url: productImagesService.getPublicUrl(img),
      }))
    : [];

  // Get badge type
  const getBadgeType = (): 'featured' | 'promotion' | 'none' => {
    if (product.featured) return 'featured';
    if (product.on_promotion) return 'promotion';
    return 'none';
  };

  // Get attributes from metadata
  const attributes = product.metadata?.attrs || {};
  const hasAttributes = Object.keys(attributes).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <a href="/" className="text-gray-500 hover:text-gray-700">
                Início
              </a>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <a href="/catalog" className="text-gray-500 hover:text-gray-700">
                Catálogo
              </a>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main Content - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                  Sem imagem
                </div>
              )}

              {/* Badge */}
              {getBadgeType() !== 'none' && (
                <div className="absolute top-4 left-4 z-10">
                  {getBadgeType() === 'featured' ? (
                    <div className="bg-yellow-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <Star size={16} fill="currentColor" />
                      Destaque
                    </div>
                  ) : (
                    <div className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <Tag size={16} />
                      Promoção
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map(({ path, url }, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(path)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-md ${
                      mainImage === path ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                  {product.categories[0].name}
                </span>
              </div>
            )}

            {/* Name */}
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {canSeePrice ? getPrice(product) : 'Preço sob consulta'}
              </div>
              
              {/* Share Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      url: window.location.href,
                    });
                  }
                }}
              >
                <ArrowRight size={20} />
              </Button>
            </div>

            {/* Support Text */}
            <p className="text-gray-600 leading-relaxed">
              Tire dúvidas com o Nas e finalize sua compra com nosso time de consultores.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleInterestClick}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg transition-all"
              >
                Gostei desse produto
              </Button>
              
              <Button
                onClick={() => setModalOpen(true)}
                variant="outline"
                size="lg"
                className="w-full py-6 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-all"
              >
                Quais as condições?
              </Button>
            </div>

            {/* Attributes */}
            {hasAttributes && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Especificações</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                        {key}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Descrição do produto</h2>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-gray-700 leading-relaxed text-lg max-w-4xl">
              {product.description}
            </p>
          </div>
        </div>

        {/* Related Products Section */}
        {!loadingRelated && relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  showBadge={relatedProduct.featured ? 'featured' : relatedProduct.on_promotion ? 'promotion' : 'none'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interest Modal */}
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
                  'Qual é o Valor?'
                )}
              </Button>
            </div>
          </form>

          {/* WhatsApp Actions */}
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