import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { showSuccess, showError } from '@/utils/toast';

const HomeHeroAdmin = () => {
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    highlight_word: '',
    image_url: '',
    image_alt: '',
    active: true,
  });

  useEffect(() => {
    loadHero();
  }, []);

  const loadHero = async () => {
    setLoading(true);
    try {
      const data = await homeHeroService.getHomeHero();
      if (data) {
        setHero(data);
        setFormData({
          title: data.title,
          highlight_word: data.highlight_word || '',
          image_url: data.image_url || '',
          image_alt: data.image_alt || '',
          active: data.active,
        });
      }
    } catch (error) {
      console.error('[HomeHeroAdmin] Failed to load hero:', error);
      showError('Erro ao carregar Hero');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const savedHero = await homeHeroService.upsertHomeHero({
        title: formData.title.trim(),
        highlight_word: formData.highlight_word.trim() || null,
        image_url: formData.image_url.trim() || null,
        image_alt: formData.image_alt.trim() || null,
        active: formData.active,
      });

      setHero(savedHero);
      showSuccess('Hero salvo com sucesso!');
    } catch (error) {
      console.error('[HomeHeroAdmin] Failed to save hero:', error);
      showError('Erro ao salvar Hero');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewToggle = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin - Hero Banner</h1>
          <p className="text-gray-600 text-sm mt-1">
            Configure o banner principal da página inicial
          </p>
        </div>
        <Link to="/app/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>
              Preencha os dados do Hero Banner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Porque a sua casa merece o melhor."
                  disabled={saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlight_word">Palavra Destacada (opcional)</Label>
                <Input
                  id="preview"
                  value={formData.highlight_word}
                  onChange={(e) => setFormData({ ...formData, highlight_word: e.target.value })}
                  placeholder="Ex: merece o melhor"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500">
                  Esta palavra será destacada em verde no título.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_alt">Texto Alternativo da Imagem</Label>
                <Textarea
                  id="image_alt"
                  value={formData.image_alt}
                  onChange={(e) => rápido: setFormData({ ...formData, image_alt: e.target.value })}
                  placeholder="Descrição da imagem para acessibilidade"
                  rows={2}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  disabled={saving}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Hero Ativo
                </Label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewToggle}
                  disabled={saving}
                >
                  {formData.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
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
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={18} />
              Preview
            </CardTitle>
            <CardDescription>
              Visualização em tempo real das alterações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                {/* Preview do Hero */}
                <div className="relative h-[400px] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-gray-200"
                    style={{
                      backgroundImage: formData.image_url 
                        ? `url('${formData.image_url}')` 
                        : "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80')"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
                  </div>

                  <div className="relative z-10 max-w-2xl mx-auto p-8 h-full flex items-center">
                    <div className="space-y-4">
                      <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {formData.highlight_word ? (
                          <>
                            {formData.title.split(formData.highlight_word).map((part, index) => (
                              <React.Fragment key={index}>
                                {part}
                                {index < formData.title.split(formData.highlight_word).length - 1 && (
                                  <span className="text-green-400">{formData.highlight_word}</span>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          formData.title || 'Título do Hero'
                        )}
                      </h1>

                      <p className="text-base text-gray-200">
                        Atendimento personalizado com o Nas e suporte do nosso time de consultores.
                      </p>

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Ver Catálogo
                        </Button>
                        <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                          Falar com o Nas
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações do preview */}
                <div className="p-4 bg-gray-50 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={formData.active ? 'text-green-600' : 'text-gray-500'}>
                      {formData.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {formData.image_url && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Imagem:</span>
                      <span className="text-gray-500 truncate max-w-md">
                        {formData.image_url}
                      </span>
                    </div>
                  )}
                  {formData.highlight_word && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Destaque:</span>
                      <span className="text-green-600 font-medium">
                        "{formData.highlight_word}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta informativa */}
      <Alert>
        <AlertDescription>
          <strong>Nota:</strong> O sistema mantém apenas um registro ativo. Ao salvar, o registro anterior será desativado automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default HomeHeroAdmin;