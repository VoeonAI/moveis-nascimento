import React, { useEffect, useState } from 'react';
import { productsService, Product, ProductVariant } from '@/services/productsService';
import { categoriesService, Category } from '@/services/categoriesService';
import { productImagesService } from '@/services/productImagesService';
import { supabase } from '@/core/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Star, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showSuccess, showError } from '@/utils/toast';

interface CategoryOption {
  id: string;
  name: string;
  label: string;
}

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Create/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    active: true,
    featured: false,
    on_promotion: false,
    metadata: {
      attrs: {} as Record<string, any>,
    },
  });

  // Attributes State
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image management state
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // Variants management state
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantImages, setNewVariantImages] = useState<File[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsService.listAllProducts(
          selectedCategory !== 'all' ? { categorySlug: selectedCategory } : undefined
        ),
        categoriesService.listCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Build category options: only subcategories grouped by parent
      const parents = categoriesData.filter(cat => !cat.parent_id);
      const children = categoriesData.filter(cat => cat.parent_id);
      
      const options: CategoryOption[] = children.map(child => {
        const parent = parents.find(p => p.id === child.parent_id);
        const label = parent ? `${parent.name} > ${child.name}` : child.name;
        return {
          id: child.id,
          name: child.name,
          label,
        };
      });
      
      setCategoryOptions(options);
    } catch (error) {
      console.error('[Catalog] Load error:', error);
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (product: Product): string => {
    const price = product.price ?? product.metadata?.price ?? null;
    if (price === null || price === undefined) {
      return 'Preço sob consulta';
    }
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'Preço sob consulta' : `R$ ${numPrice.toFixed(2)}`;
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setImageFiles([]);
    setCurrentImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      active: true,
      featured: false,
      on_promotion: false,
      metadata: {
        attrs: {},
      },
    });
    setNewAttrKey('');
    setNewAttrValue('');
    setNewVariantName('');
    setNewVariantImages([]);
    setEditingVariantIndex(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setImageFiles([]);
    setCurrentImages(Array.isArray(product.images) ? [...product.images] : []);
    setProductVariants(product.variants || []);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price ?? product.metadata?.price ?? ''),
      category_id: product.categories?.[0]?.id || '',
      active: product.active,
      featured: product.featured || false,
      on_promotion: product.on_promotion || false,
      metadata: {
        attrs: product.metadata?.attrs || {},
      },
    });
    setNewAttrKey('');
    setNewAttrValue('');
    setNewVariantName('');
    setNewVariantImages([]);
    setEditingVariantIndex(null);
    setModalOpen(true);
  };

  const handleSetMainImage = async (index: number) => {
    const newImages = [...currentImages];
    const [mainImage] = newImages.splice(index, 1);
    newImages.unshift(mainImage);
    setCurrentImages(newImages);
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = currentImages[index];
    
    // Remove from array
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);

    // Try to delete from storage (best-effort)
    try {
      await productImagesService.removeImage(imageToDelete);
    } catch (error) {
      console.error('[Catalog] Failed to delete image from storage:', error);
      // Continue anyway - don't block the operation
    }
  };

  const handleAddAttribute = () => {
    if (!newAttrKey.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attrs: {
          ...prev.metadata.attrs,
          [newAttrKey]: newAttrValue,
        },
      },
    }));
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    setFormData(prev => {
      const newAttrs = { ...prev.metadata.attrs };
      delete newAttrs[key];
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          attrs: newAttrs,
        },
      };
    });
  };

  // Variant management functions
  const handleAddVariant = () => {
    if (!newVariantName.trim()) {
      showError('Nome da variação é obrigatório');
      return;
    }

    const newVariant: ProductVariant = {
      id: '',
      product_id: editingProduct?.id || '',
      name: newVariantName,
      slug: newVariantName.toLowerCase().replace(/\s+/g, '-'),
      is_default: productVariants.length === 0, // First variant is default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    };

    setProductVariants([...productVariants, newVariant]);
    setNewVariantName('');
    setNewVariantImages([]);
  };

  const handleSetDefaultVariant = (index: number) => {
    const updatedVariants = productVariants.map((v, i) => ({
      ...v,
      is_default: i === index,
    }));
    setProductVariants(updatedVariants);
  };

  const handleRemoveVariant = (index: number) => {
    const updatedVariants = productVariants.filter((_, i) => i !== index);
    // If removing default, make first variant default
    if (updatedVariants.length > 0 && productVariants[index].is_default) {
      updatedVariants[0].is_default = true;
    }
    setProductVariants(updatedVariants);
  };

  const handleAddVariantImages = async (variantIndex: number) => {
    if (!editingProduct) return;

    if (newVariantImages.length === 0) {
      showError('Selecione pelo menos uma imagem');
      return;
    }

    try {
      // Create variant if it doesn't have an ID yet
      const variant = productVariants[variantIndex];
      let variantId = variant.id;

      if (!variantId) {
        // Insert new variant
        const { data: newVariant, error: insertError } = await supabase
          .from('product_variants')
          .insert({
            product_id: editingProduct.id,
            name: variant.name,
            slug: variant.slug,
            is_default: variant.is_default,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        variantId = newVariant.id;

        // Update variant ID in state
        const updatedVariants = [...productVariants];
        updatedVariants[variantIndex] = { ...variant, id: variantId };
        setProductVariants(updatedVariants);
      }

      // Upload images
      const uploadedPaths = await productImagesService.uploadProductImages(
        `${editingProduct.id}/variants/${variantId}`,
        newVariantImages
      );

      // Insert image records
      const imageRecords = uploadedPaths.map((path, index) => ({
        variant_id: variantId,
        image_url: path,
        sort_order: (variant.images?.length || 0) + index,
      }));

      const { error: imagesError } = await supabase
        .from('product_variant_images')
        .insert(imageRecords);

      if (imagesError) throw imagesError;

      // Update variant in state with new images
      const updatedVariants = [...productVariants];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        images: [
          ...(variant.images || []),
          ...imageRecords.map((rec, idx) => ({
            id: '',
            variant_id: variantId,
            image_url: uploadedPaths[idx],
            sort_order: rec.sort_order,
            created_at: new Date().toISOString(),
          })),
        ],
      };
      setProductVariants(updatedVariants);
      setNewVariantImages([]);

      showSuccess('Imagens adicionadas com sucesso');
    } catch (error: any) {
      console.error('[Catalog] Error adding variant images:', error);
      showError(error.message || 'Erro ao adicionar imagens');
    }
  };

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...productVariants];
    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      images: updatedVariants[variantIndex].images?.filter((_, i) => i !== imageIndex) || [],
    };
    setProductVariants(updatedVariants);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Nome do produto é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let productId: string;

      if (editingProduct) {
        // Update existing product
        const updated = await productsService.updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          active: formData.active,
          featured: formData.featured,
          on_promotion: formData.on_promotion,
          images: currentImages,
          metadata: {
            ...formData.metadata,
            price: formData.price ? Number(formData.price) : null,
          },
        });
        productId = updated.id;
      } else {
        // Create new product
        const created = await productsService.createProduct({
          name: formData.name,
          description: formData.description,
          active: formData.active,
          featured: formData.featured,
          on_promotion: formData.on_promotion,
          metadata: {
            ...formData.metadata,
            price: formData.price ? Number(formData.price) : null,
          },
          images: [],
        });
        productId = created.id;
      }

      // Handle image uploads
      let uploadedPaths: string[] = [];
      if (imageFiles.length > 0) {
        uploadedPaths = await productImagesService.uploadProductImages(productId, imageFiles);
      }

      // Update product with all images (current + new)
      const allImages = [...currentImages, ...uploadedPaths];
      await productsService.updateProduct(productId, {
        images: allImages,
      });

      // Handle category association
      if (formData.category_id) {
        await categoriesService.setProductCategories(productId, [formData.category_id]);
      }

      // Handle variants
      for (const variant of productVariants) {
        // Create or update variant
        let variantId = variant.id;

        if (!variantId) {
          // Insert new variant
          const { data: newVariant, error: insertError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              name: variant.name,
              slug: variant.slug,
              is_default: variant.is_default,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          variantId = newVariant.id;
        } else {
          // Update existing variant
          await supabase
            .from('product_variants')
            .update({
              name: variant.name,
              slug: variant.slug,
              is_default: variant.is_default,
              updated_at: new Date().toISOString(),
            })
            .eq('id', variantId);
        }

        // Handle variant images
        // First, delete all existing images for this variant (simpler approach)
        await supabase
          .from('product_variant_images')
          .delete()
          .eq('variant_id', variantId);

        // Then insert all images
        if (variant.images && variant.images.length > 0) {
          const imageRecords = variant.images.map((img, index) => ({
            variant_id: variantId,
            image_url: img.image_url,
            sort_order: index,
          }));

          await supabase
            .from('product_variant_images')
            .insert(imageRecords);
        }
      }

      showSuccess(editingProduct ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso');
      setImageFiles([]);
      setCurrentImages([]);
      setProductVariants([]);
      setModalOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('[Catalog] Save error:', error);
      showError(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      await productsService.deleteProduct(productToDelete.id);
      showSuccess('Produto excluído com sucesso');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error('[Catalog] Delete error:', error);
      showError(error.message || 'Erro ao excluir produto');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8">Carregando catálogo...</div>;

  // Build category hierarchy for filter dropdown
  const rootCategories = categories.filter(cat => !cat.parent_id);
  const subCategories = categories.filter(cat => cat.parent_id);
  const getCategoryLabel = (cat: Category) => {
    if (cat.parent_id) {
      const parent = categories.find(c => c.id === cat.parent_id);
      return parent ? `${parent.name} > ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie produtos e categorias
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            Atualizar
          </Button>
          <Button onClick={handleOpenCreateModal}>
            <Plus size={16} className="mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filtrar por categoria:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {rootCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
              {subCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const coverPath = Array.isArray(product.images) ? product.images[0] : null;
          const coverUrl = coverPath ? productImagesService.getPublicUrl(coverPath) : '';
          
          return (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">
                    Sem imagem
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-600">
                    {formatPrice(product)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(product)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                {product.categories && product.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  {product.featured && (
                    <Badge variant="default" className="text-xs">Em Destaque</Badge>
                  )}
                  {product.on_promotion && (
                    <Badge variant="secondary" className="text-xs">Promoção</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum produto encontrado
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={saving}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria do Produto</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={saving}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Nenhuma subcategoria disponível
                    </div>
                  ) : (
                    categoryOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                disabled={saving}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Produto Ativo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                disabled={saving}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Produto em Destaque (Vitrine)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="on_promotion"
                checked={formData.on_promotion}
                onCheckedChange={(checked) => setFormData({ ...formData, on_promotion: checked })}
                disabled={saving}
              />
              <Label htmlFor="on_promotion" className="cursor-pointer">
                Em Promoção (Selo)
              </Label>
            </div>

            {/* Current Images Management */}
            {editingProduct && currentImages.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Fotos Atuais</Label>
                <div className="grid grid-cols-4 gap-2">
                  {currentImages.map((path, index) => {
                    const url = productImagesService.getPublicUrl(path);
                    const isMain = index === 0;
                    
                    return (
                      <div key={index} className={`relative group rounded overflow-hidden border-2 ${isMain ? 'border-blue-500' : 'border-gray-200'}`}>
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center p-1">
                          {!isMain && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full text-xs h-7"
                              onClick={() => handleSetMainImage(index)}
                              disabled={saving}
                            >
                              <Star size={12} className="mr-1" />
                              Principal
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full text-xs h-7"
                            onClick={() => handleDeleteImage(index)}
                            disabled={saving}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>

                        {isMain && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white p-1 rounded-full">
                            <Star size={10} fill="white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attributes Section */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Atributos (Metadata)</Label>
              <div className="space-y-2">
                {Object.entries(formData.metadata.attrs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm flex-1">{key}:</span>
                    <span className="text-sm text-gray-600 flex-1">{String(value)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttribute(key)}
                      disabled={saving}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Chave (ex: cor, material)"
                  value={newAttrKey}
                  onChange={(e) => setNewAttrKey(e.target.value)}
                  disabled={saving}
                />
                <Input
                  placeholder="Valor"
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(e.target.value)}
                  disabled={saving}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAttribute}
                  disabled={saving || !newAttrKey.trim()}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Variants Section */}
            {editingProduct && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-gray-600" />
                  <Label>Variações (Cores)</Label>
                </div>
                <p className="text-xs text-gray-500">
                  Adicione variações do produto com suas próprias imagens (ex: Branco, Madeira).
                </p>

                {/* Add new variant */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da variação (ex: Branco)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddVariant}
                    disabled={saving || !newVariantName.trim()}
                  >
                    <Plus size={14} />
                    Adicionar
                  </Button>
                </div>

                {/* List existing variants */}
                {productVariants.length > 0 && (
                  <div className="space-y-3">
                    {productVariants.map((variant, variantIndex) => (
                      <div key={variantIndex} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {variant.is_default && (
                              <Badge variant="default" className="text-xs">Padrão</Badge>
                            )}
                            <span className="font-medium">{variant.name}</span>
                          </div>
                          <div className="flex gap-1">
                            {!variant.is_default && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetDefaultVariant(variantIndex)}
                                disabled={saving}
                                title="Definir como padrão"
                              >
                                <Star size={14} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveVariant(variantIndex)}
                              disabled={saving}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        {/* Variant images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {variant.images.map((img, imgIndex) => {
                              const url = productImagesService.getPublicUrl(img.image_url);
                              return (
                                <div key={imgIndex} className="relative group rounded overflow-hidden border">
                                  <img
                                    src={url}
                                    alt={`${variant.name} ${imgIndex + 1}`}
                                    className="w-full h-16 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="w-full h-full"
                                      onClick={() => handleRemoveVariantImage(variantIndex, imgIndex)}
                                      disabled={saving}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add images to variant */}
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={saving}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setNewVariantImages(files);
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddVariantImages(variantIndex)}
                            disabled={saving || newVariantImages.length === 0}
                          >
                            <Plus size={14} />
                            Fotos
                          </Button>
                        </div>

                        {/* Preview new images */}
                        {newVariantImages.length > 0 && editingVariantIndex === variantIndex && (
                          <div className="flex gap-2 flex-wrap">
                            {newVariantImages.map((file, idx) => (
                              <img
                                key={idx}
                                src={URL.createObjectURL(file)}
                                alt="preview"
                                className="w-16 h-16 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Upload Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Novas Fotos</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                disabled={saving}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImageFiles(files);
                }}
              />
              <p className="text-xs text-gray-500">
                Você pode selecionar várias imagens.
              </p>

              {imageFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {imageFiles.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Save size={16} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto <strong>"{productToDelete?.name}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Catalog;