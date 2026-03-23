import React, { useState, useEffect } from 'react';
import { supabase } from '@/core/supabaseClient';
import { useAuth } from '@/core/auth/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { homeAmbiencesService, HomeAmbience } from '@/services/homeAmbiencesService';
import { homePromoBannerService, HomePromoBanner } from '@/services/homePromoBannerService';
import { homeAssetsService } from '@/services/homeAssetsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Settings = () => {
  const { profile } = useAuth();
  const isMaster = profile?.role === 'master';

  // Hero State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);
  const [savingHero, setSavingHero] = useState(false);

  // NOVO: Estado para o arquivo selecionado
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null);

  // Ambiences State
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [loadingAmbiences, setLoadingAmbiences] = useState(true);
  const [editingAmbience, setEditingAmbience] = useState<HomeAmbience | null>(null);
  const [ambienceModalOpen, setAmbienceModalOpen] = useState(false);
  const [ambienceFormData, setAmbienceFormData] = useState({
    title: '',
    category_slug: '',
    image_url: '',
    active: true,
  });
  const [savingAmbience, setSavingAmbience] = useState(false);

  // Promo Banner State
  const [promoImageUrl, setPromoImageUrl] = useState('');
  const [promoImageAlt, setPromoImageAlt] = useState('');
  const [promoText, setPromoText] = useState('');
  const [promoShowText, setPromoShowText] = useState(true);
  const [promoImageError, setPromoImageError] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  // Load initial data
  useEffect(() => {
    loadHero();
    loadAmbiences();
    loadPromoBanner();
  }, []);

  const loadHero = async () => {
    try {
      const data = await homeHeroService.getHomeHero();
      if (data) {
        setHeroTitle(data.title || '');
        setHeroHighlight(data.highlight_word || '');
        setHeroImageUrl(data.image_url || '');
        setHeroImageAlt(data.image_alt || '');
      }
    } catch (error) {
      console.error('[Settings] Failed to load hero:', error);
    }
  };

  const loadAmbiences = async () => {
    setLoadingAmbiences(true);
    try {
      const data = await homeAmbiencesService.listAllAmbiences();
      setAmbiences(data);
    } catch (error) {
      console.error('[Settings] Failed to load ambiences:', error);
    } finally {
      setLoadingAmbiences(false);
    }
  };

  const loadPromoBanner = async () => {
    try {
      const data = await homePromoBannerService.getPromoBanner();
      if (data) {
        setPromoImageUrl(data.image_url || '');
        setPromoImageAlt(data.image_alt || '');
        setPromoText(data.text || '');
        setPromoShowText(data.show_text ?? true);
      }
    } catch (error) {
      console.error('[Settings] Failed to load promo banner:', error);
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    try {
      await homeHeroService.upsertHomeHero({
        title: heroTitle,
        highlight_word: heroHighlight,
        image_url: heroImageUrl,
        image_alt: heroImageAlt,
        active: true,
      });
      showSuccess('Banner salvo com sucesso');
    } catch (error) {
      console.error('[Settings] Failed to save hero:', error);
      showError('Erro ao salvar banner');
    } finally {
      setSavingHero(false);
    }
  };

  const handleOpenAmbienceModal = (ambience?: HomeAmbience) => {
    if (ambience) {
      setEditingAmbience(ambience);
      setAmbienceFormData({
        title: ambience.title,
        category_slug: ambience.category_slug,
        image_url: ambience.image_url,
        active: ambience.active,
      });
    } else {
      setEditingAmbience(null);
      setAmbienceFormData({
        title: '',
        category_slug: '',
        image_url: '',
        active: true,
      });
    }
    setAmbienceModalOpen(true);
  };

  const handleSaveAmbience = async () => {
    if (!ambienceFormData.title.trim()) {
      showError('Título é obrigatório');
      return;
    }

    setSavingAmbience(true);
    try {
      if (editingAmbience) {
        await homeAmbiencesService.updateAmbience(editingAmbience.id, {
          title: ambienceFormData.title,
          category_slug: ambienceFormData.category_slug,
          image_url: ambienceFormData.image_url,
          active: ambienceFormData.active,
        });
        showSuccess('Ambiente atualizado com sucesso');
      } else {
        await homeAmbiencesService.createHomeAmbience();
        showSuccess('Ambiente criado com sucesso');
      }
      setAmbienceModalOpen(false);
      await loadAmbiences();
    } catch (error) {
      console.error('[Settings] Failed to save ambience:', error);
      showError('Erro ao salvar ambiente');
    } finally {
      setSavingAmbience(false);
    }
  };

  const handleDeleteAmbience = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ambiente?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('home_ambiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Ambiente excluído com sucesso');
      await loadAmbiences();
    } catch (error) {
      console.error('[Settings] Failed to delete ambience:', error);
      showError('Erro ao excluir ambiente');
    }
  };

  const handleSavePromo = async () => {
    setSavingPromo(true);
    try {
      await homePromoBannerService.upsertPromoBanner({
        image_url: promoImageUrl,
        image_alt: promoImageAlt,
        text: promoText,
        show_text: promoShowText,
        active: true,
      });
      showSuccess('Banner promocional salvo com sucesso');
    } catch (error) {
      console.error('[Settings] Failed to save promo:', error);
      showError('Erro ao salvar banner promocional');
    } finally {
      setSavingPromo(false);
    }
  };

  if (!isMaster) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Acesso restrito a usuários Master
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-600">Personalize a página inicial</p>
      </div>

      <Tabs defaultValue="home_hero">
        <TabsList>
          <TabsTrigger value="home_hero">Banner Principal</TabsTrigger>
          <TabsTrigger value="ambiences">Ambientes</TabsTrigger>
          <TabsTrigger value="promo_banner">Banner Promocional</TabsTrigger>
        </TabsList>

        {isMaster && (
          <TabsContent value="home_hero">
            <Card>
              <CardHeader>
                <CardTitle>Banner Principal (Home Hero)</CardTitle>
                <CardDescription>Personalize o banner da página inicial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Título Principal</Label>
                  <Input
                    id="hero_title"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Ex: Porque a sua casa merece o melhor."
                    disabled={savingHero}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_highlight">Palavra de Destaque</Label>
                  <Input
                    id="hero_highlight"
                    value={heroHighlight}
                    onChange={(e) => setHeroHighlight(e.target.value)}
                    placeholder="Ex: merece o melhor."
                    disabled={savingHero}
                  />
                  <p className="text-xs text-gray-500">
                    Esta palavra será destacada em verde dentro do título.
                  </p>
                </div>

                {/* Upload de Imagem - NOVO */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enviar imagem do banner</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setSelectedHeroFile(file);
                    }}
                    className="block w-full text-sm"
                  />

                  <p className="text-xs text-muted-foreground">
                    Recomendado: imagem horizontal 1920x700
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {selectedHeroFile
                      ? `Arquivo selecionado: ${selectedHeroFile.name}`
                      : 'Nenhum arquivo selecionado'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">URL da Imagem (1920x700px recomendado)</Label>
                  <Input
                    id="hero_image_url"
                    value={heroImageUrl}
                    onChange={(e) => {
                      setHeroImageUrl(e.target.value);
                      setHeroImageError(false);
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    disabled={savingHero}
                  />
                  <p className="text-xs text-gray-500">
                    Use uma imagem com proporção aproximada de 2.7:1 (1920x700) para melhor visualização.
                  </p>
                  
                  {/* Preview da Imagem */}
                  {heroImageUrl && (
                    <div className="mt-2 border rounded-md overflow-hidden bg-gray-50">
                      <img
                        src={heroImageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={() => setHeroImageError(true)}
                        style={{ display: heroImageError ? 'none' : 'block' }}
                      />
                      {heroImageError && (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                          <X size={16} className="mr-2" />
                          Erro ao carregar imagem
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image_alt">Texto Alternativo (Alt)</Label>
                  <Input
                    id="hero_image_alt"
                    value={heroImageAlt}
                    onChange={(e) => setHeroImageAlt(e.target.value)}
                    placeholder="Descrição da imagem para acessibilidade"
                    disabled={savingHero}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveHero} disabled={savingHero}>
                    {savingHero ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Salvar Banner
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="ambiences">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ambientes</CardTitle>
                  <CardDescription>Gerencie os ambientes exibidos na página inicial.</CardDescription>
                </div>
                <Button onClick={() => handleOpenAmbienceModal()}>
                  <Plus size={16} className="mr-2" />
                  Novo Ambiente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAmbiences ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : ambiences.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum ambiente cadastrado
                </div>
              ) : (
                <div className="space-y-4">
                  {ambiences.map((ambience) => (
                    <div key={ambience.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{ambience.title}</h3>
                        <p className="text-sm text-gray-500">Categoria: {ambience.category_slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ambience.active}
                          onCheckedChange={(checked) => {
                            homeAmbiencesService.updateAmbience(ambience.id, { active: checked })
                              .then(() => loadAmbiences())
                              .catch(() => showError('Erro ao atualizar'));
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAmbienceModal(ambience)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAmbience(ambience.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promo_banner">
          <Card>
            <CardHeader>
              <CardTitle>Banner Promocional</CardTitle>
              <CardDescription>Configure o banner promocional exibido na página inicial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="promo_image_url">URL da Imagem</Label>
                <Input
                  id="promo_image_url"
                  value={promoImageUrl}
                  onChange={(e) => {
                    setPromoImageUrl(e.target.value);
                    setPromoImageError(false);
                  }}
                  placeholder="https://exemplo.com/promo.jpg"
                  disabled={savingPromo}
                />
                <p className="text-xs text-gray-500">
                  Use uma imagem com proporção aproximada de 16:9 (1920x1080) para melhor visualização.
                </p>
                
                {/* Preview da Imagem */}
                {promoImageUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden bg-gray-50">
                    <img
                      src={promoImageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                      onError={() => setPromoImageError(true)}
                      style={{ display: promoImageError ? 'none' : 'block' }}
                    />
                    {promoImageError && (
                      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                        <X size={16} className="mr-2" />
                        Erro ao carregar imagem
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_image_alt">Texto Alternativo (Alt)</Label>
                <Input
                  id="promo_image_alt"
                  value={promoImageAlt}
                  onChange={(e) => setPromoImageAlt(e.target.value)}
                  placeholder="Descrição da imagem para acessibilidade"
                  disabled={savingPromo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_text">Texto do Banner</Label>
                <Textarea
                  id="promo_text"
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  placeholder="Texto a ser exibido sobre a imagem"
                  disabled={savingPromo}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="promo_show_text"
                  checked={promoShowText}
                  onCheckedChange={setPromoShowText}
                  disabled={savingPromo}
                />
                <Label htmlFor="promo_show_text" className="cursor-pointer">
                  Exibir texto sobre a imagem
                </Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePromo} disabled={savingPromo}>
                  {savingPromo ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar Banner
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Ambiente */}
      <Dialog open={ambienceModalOpen} onOpenChange={setAmbienceModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAmbience ? 'Editar Ambiente' : 'Novo Ambiente'}</DialogTitle>
            <DialogDescription>
              {editingAmbience ? 'Atualize os dados do ambiente.' : 'Preencha os dados para criar um novo ambiente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ambience_title">Título *</Label>
              <Input
                id="ambience_title"
                value={ambienceFormData.title}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, title: e.target.value })}
                disabled={savingAmbience}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambience_category">Slug da Categoria *</Label>
              <Input
                id="ambience_category"
                value={ambienceFormData.category_slug}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, category_slug: e.target.value })}
                placeholder="ex: sala, quarto, cozinha"
                disabled={savingAmbience}
              />
              <p className="text-xs text-gray-500">
                Use o slug da categoria (ex: sala, quarto, cozinha)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambience_image_url">URL da Imagem</Label>
              <Input
                id="ambience_image_url"
                value={ambienceFormData.image_url}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, image_url: e.target.value })}
                placeholder="https://exemplo.com/ambiente.jpg"
                disabled={savingAmbience}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ambience_active"
                checked={ambienceFormData.active}
                onCheckedChange={(checked) => setAmbienceFormData({ ...ambienceFormData, active: checked })}
                disabled={savingAmbience}
              />
              <Label htmlFor="ambience_active" className="cursor-pointer">
                Ambiente ativo
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setAmbienceModalOpen(false)}
                disabled={savingAmbience}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveAmbience} disabled={savingAmbience}>
                {savingAmbience ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;