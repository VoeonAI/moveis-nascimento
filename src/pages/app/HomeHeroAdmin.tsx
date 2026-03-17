import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { homeHeroService, type HomeHero } from '@/services/homeHeroService';
import { showError, showSuccess } from '@/utils/toast';

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80";

const HomeHeroAdmin = () => {
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    highlight_word: '',
    image_url: '',
    image_alt: '',
    active: true,
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      try {
        const data = await homeHeroService.getHomeHero();

        if (data) {
          setHero(data);
          setFormData({
            title: data.title ?? '',
            highlight_word: data.highlight_word ?? '',
            image_url: data.image_url ?? '',
            image_alt: data.image_alt ?? '',
            active: data.active ?? true,
          });
        }
      } catch (error) {
        console.error('[HomeHeroAdmin] Failed to load hero:', error);
        showError('Erro ao carregar Hero');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
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
    setFormData((prev) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  const previewTitle = useMemo(() => {
    const title = formData.title || 'Título do Hero';
    const highlight = formData.highlight_word?.trim();

    if (!highlight || !title.includes(highlight)) {
      return (
        <span className="text-white">
          {title}
        </span>
      );
    }

    const parts = title.split(highlight);

    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={`${part}-${index}`}>
            <span className="text-white">{part}</span>
            {index < parts.length - 1 && (
              <span className="text-green-400">{highlight}</span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  }, [formData.title, formData.highlight_word]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin - Hero Banner</h1>
          <p className="mt-1 text-sm text-gray-600">
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Porque a sua casa merece o melhor."
                  disabled={saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlight_word">
                  Palavra Destacada (opcional)
                </Label>
                <Input
                  id="highlight_word"
                  value={formData.highlight_word}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      highlight_word: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_alt">Texto Alternativo da Imagem</Label>
                <Textarea
                  id="image_alt"
                  value={formData.image_alt}
                  onChange={(e) =>
                    setFormData({ ...formData, image_alt: e.target.value })
                  }
                  placeholder="Descrição da imagem para acessibilidade"
                  rows={2}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                  disabled={saving}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Hero Ativo
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
              <div className="overflow-hidden rounded-lg border">
                <div className="relative h-[400px] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-center bg-cover bg-gray-200"
                    style={{
                      backgroundImage: `url('${
                        formData.image_url || DEFAULT_IMAGE
                      }')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                  </div>

                  <div className="relative z-10 mx-auto flex h-full max-w-2xl items-center p-8">
                    <div className="space-y-4">
                      <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">
                        {previewTitle}
                      </h1>

                      <p className="text-base text-gray-200">
                        Atendimento personalizado com o Nas e suporte do nosso
                        time de consultores.
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          Ver Catálogo
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-gray-900"
                        >
                          Falar com o Nas
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span
                      className={
                        formData.active ? 'text-green-600' : 'text-gray-500'
                      }
                    >
                      {formData.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {formData.image_url && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Imagem:</span>
                      <span className="max-w-md truncate text-gray-500">
                        {formData.image_url}
                      </span>
                    </div>
                  )}

                  {formData.highlight_word && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">
                        Destaque:
                      </span>
                      <span className="font-medium text-green-600">
                        "{formData.highlight_word}"
                      </span>
                    </div>
                  )}

                  {hero && (
                    <div className="text-xs text-gray-500">
                      Registro carregado com sucesso.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Alert>
          <AlertDescription>
            <strong>Nota:</strong> O sistema mantém apenas um registro ativo. Ao
            salvar, o registro anterior será desativado automaticamente.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default HomeHeroAdmin;