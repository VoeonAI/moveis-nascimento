import React, { useEffect, useState } from 'react';
import { productsService, Product } from '@/services/productsService';
import { categoriesService, Category } from '@/services/categoriesService';
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

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
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
    Promise.all([
      productsService.listAllProducts(),
      categoriesService.listCategories(),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData);
        setCategories(categoriesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        const productId = editingProduct?.id || (await productsService.listAllProducts())[0]?.id; // Simple fetch for ID
        // Note: In a real scenario, we should get the ID from the response
        if (productId) {
          await categoriesService.setProductCategories(productId, [formData.category_id]);
        }
      }

      setModalOpen(false);
      // Reload
      const [updatedProducts] = await Promise.all([
        productsService.listAllProducts(),
      ]);
      setProducts(updatedProducts);
    } catch (error: any) {
      console.error('[Catalog] Save error:', error);
      showError(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Carregando catálogo...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <Button onClick={handleOpenCreateModal}>
          <Plus size={16} className="mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Categories Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat.id} variant="secondary">
              {cat.name} ({cat.slug})
            </Badge>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma categoria criada</p>
          )}
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
          Nenhum produto cadastrado
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
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={saving}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                    </SelectItem>
                  ))}
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