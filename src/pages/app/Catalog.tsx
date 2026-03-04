import React, { useEffect, useState } from 'react';
import { productsService, Product } from '@/services/productsService';
import { categoriesService, Category } from '@/services/categoriesService';
import { productImagesService } from '@/services/productImagesService';
import { supabase } from '@/core/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    metadata: {
      attrs: {} as Record<string, any>,
    },
  });

  // Attributes State
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

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
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      active: true,
      metadata: {
        attrs: {},
      },
    });
    setNewAttrKey('');
    setNewAttrValue('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setImageFiles([]);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price ?? product.metadata?.price ?? ''),
      category_id: product.categories?.[0]?.id || '',
      active: product.active,
      metadata: {
        attrs: product.metadata?.attrs || {},
      },
    });
    setNewAttrKey('');
    setNewAttrValue('');
    setModalOpen(true);
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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Nome do produto é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const productData: any = {
        name: formData.name,
        description: formData.description,
        active: formData.active,
        metadata: {
          ...formData.metadata,
          price: formData.price ? Number(formData.price) : null,
        },
        images: [],
      };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, productData);
        showSuccess('Produto atualizado com sucesso');
      } else {
        await productsService.createProduct(productData);
        showSuccess('Produto criado com sucesso');
      }

      // Handle category association
      if (formData.category_id) {
        const productId = editingProduct?.id || (await productsService.listAllProducts())[0]?.id;
        if (productId) {
          await categoriesService.setProductCategories(productId, [formData.category_id]);
        }
      }

      setModalOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('[Catalog] Save error:', error);
      showError(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
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
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Button variant="ghost" size="icon">
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
            </CardContent>
          </Card>
        ))}
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

            {/* Image Upload Section */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">Fotos do Produto</label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImageFiles(files);
                }}
              />

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
    </div>
  );
};

export default Catalog;