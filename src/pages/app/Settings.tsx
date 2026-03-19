import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Save, 
  RefreshCw, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { homePromoBannerService, HomePromoBanner } from '@/services/homePromoBannerService';
import { homeAmbiencesService, HomeAmbience } from '@/services/homeAmbiencesService';
import { homeAssetsService } from '@/services/homeAssetsService';
import { webhooksManagementService } from '@/services/webhooksManagementService';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { PermissionGate } from '@/core/guards/PermissionGate';

const Settings = () => {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  // Hero State
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [savingHero, setSavingHero] = useState(false);

  // Promo Banner State
  const [promoBanner, setPromoBanner] = useState<HomePromoBanner | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoImageUrl, setPromoImageUrl] = useState('');
  const [promoImageAlt, setPromoImageAlt] = useState('');
  const [promoText, setPromoText] = useState('');
  const [promoShowText, setPromoShowText] = useState(true);
  const [savingPromo, setSavingPromo] = useState(false);

  // Ambiences State
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [ambiencesLoading, setAmbiencesLoading] = useState(false);

  // Webhooks State
  const [webhookEndpoints, setWebhookEndpoints] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [showWebhookLogs, setShowWebhookLogs] = useState(false);
  const [webhookLogsLoading, setWebhookLogsLoading] = useState(false);

  // Webhook Form State
  const [webhookFormOpen, setWebhookFormOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<any>(null);
  const [webhookFormData, setWebhookFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true,
  });

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [endpointToDelete, setEndpointToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // File Input Refs
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);

  // Upload States
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);

  // Image Error States
  const [heroImageError, setHeroImageError] = useState(false);
  const [promoImageError, setPromoImageError] = useState(false);

  // Load Hero Data
  useEffect(() => {
    if (isMaster) loadHeroData();
  }, [isMaster]);

  const loadHeroData = async () => {
    setHeroLoading(true);
    try {
      const data = await homeHeroService.getHomeHero();
      setHero(data);
      if (data) {
        setHeroTitle(data.title || '');
        setHeroHighlight(data.highlight_word || '');
        setHeroImageUrl(data.image_url || '');
        setHeroImageAlt(data.image_alt || '');
      }
    } catch (error: any) {
      console.error('[Settings] load hero error', error);
      showError(error.message || 'Erro ao carregar banner principal');
    } finally {
      setHeroLoading(false);
    }
  };

  const handleSaveHero = async () => {
    if (!isMaster) return;

    setSavingHero(true);
    try {
      await homeHeroService.upsertHomeHero({
        title: heroTitle || null,
        highlight_word: heroHighlight || null,
        image_url: heroImageUrl || null,
        image_alt: heroImageAlt || null,
        active: true,
      });
      showSuccess('Banner salvo com sucesso');
      await loadHeroData();
    } catch (error: any) {
      console.error('[Settings] save hero error', error);
      showError(error.message || 'Erro ao salvar banner');
    } finally {
      setSavingHero(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroImage(true);
    try {
      const publicUrl = await homeAssetsService.uploadHeroImage(file);
      setHeroImageUrl(publicUrl);
      setHeroImageError(false);
      showSuccess("Imagem enviada com sucesso");
    } catch (error: any) {
      console.error("[Settings] hero image upload error", error);
      showError(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingHeroImage(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  // Load Promo Banner Data
  useEffect(() => {
    if (isMaster) loadPromoData();
  }, [isMaster]);

  const loadPromoData = async () => {
    setPromoLoading(true);
    try {
      const data = await homePromoBannerService.getPromoBanner();
      setPromoBanner(data);
      if (data) {
        setPromoImageUrl(data.image_url || '');
        setPromoImageAlt(data.image_alt || '');
        setPromoText(data.text || '');
        setPromoShowText(data.show_text !== false);
      }
    } catch (error: any) {
      console.error('[Settings] load promo error', error);
      showError(error.message || 'Erro ao carregar banner promocional');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSavePromo = async () => {
    if (!isMaster) return;

    setSavingPromo(true);
    try {
      await homePromoBannerService.upsertPromoBanner({
        image_url: promoImageUrl || '',
        image_alt: promoImageAlt || '',
        text: promoText || '',
        show_text: promoShowText,
        active: true,
      });
      showSuccess('Banner promocional salvo com sucesso');
      await loadPromoData();
    } catch (error: any) {
      console.error('[Settings] save promo error', error);
      showError(error.message || 'Erro ao salvar banner promocional');
    } finally {
      setSavingPromo(false);
    }
  };

  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPromoImage(true);
    try {
      const publicUrl = await homeAssetsService.uploadPromoImage(file);
      setPromoImageUrl(publicUrl);
      setPromoImageError(false);
      showSuccess("Imagem enviada com sucesso");
    } catch (error: any) {
      console.error("[Settings] promo image upload error", error);
      showError(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingPromoImage(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (promoFileInputRef.current) {
        promoFileInputRef.current.value = '';
      }
    }
  };

  // Load Ambiences Data
  useEffect(() => {
    if (isMaster) loadAmbiencesData();
  }, [isMaster]);

  const loadAmbiencesData = async () => {
    setAmbiencesLoading(true);
    try {
      const data = await homeAmbiencesService.listAllAmbiences();
      setAmbiences(data);
    } catch (error: any) {
      console.error('[Settings] load ambiences error', error);
      showError(error.message || 'Erro ao carregar ambientes');
    } finally {
      setAmbiencesLoading(false);
    }
  };

  const handleCreateAmbience = async () => {
    if (!isMaster) return;

    try {
      const newAmbience = await homeAmbiencesService.createHomeAmbience();
      setAmbiences([...ambiences, newAmbience]);
      showSuccess('Ambiente criado com sucesso');
    } catch (error: any) {
      console.error('[Settings] create ambience error', error);
      showError(error.message || 'Erro ao criar ambiente');
    }
  };

  const handleUpdateAmbience = async (id: string, field: string, value: any) => {
    if (!isMaster) return;

    try {
      await homeAmbiencesService.updateAmbience(id, { [field]: value });
      showSuccess('Ambiente atualizado com sucesso');
      await loadAmbiencesData();
    } catch (error: any) {
      console.error('[Settings] update ambience error', error);
      showError(error.message || 'Erro ao atualizar ambiente');
    }
  };

  const handleAmbienceImageUpload = async (ambienceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await homeAssetsService.uploadAmbienceImage(file);
      await handleUpdateAmbience(ambienceId, 'image_url', publicUrl);
    } catch (error: any) {
      console.error('[Settings] ambience image upload error', error);
      showError(error.message || 'Erro ao enviar imagem');
    }
  };

  // Load Webhooks Data
  useEffect(() => {
    if (isMaster) loadWebhooksData();
  }, [isMaster]);

  const loadWebhooksData = async () => {
    setWebhooksLoading(true);
    try {
      const [endpointsData, logsData] = await Promise.all([
        webhooksManagementService.listEndpoints(),
        webhooksManagementService.listLogs(20),
      ]);
      setWebhookEndpoints(endpointsData);
      setWebhookLogs(logsData);
    } catch (error: any) {
      console.error('[Settings] load webhooks error', error);
      showError(error.message || 'Erro ao carregar webhooks');
    } finally {
      setWebhooksLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!isMaster) return;

    try {
      if (editingEndpoint) {
        await webhooksManagementService.updateEndpoint(editingEndpoint.id, webhookFormData);
        showSuccess('Endpoint atualizado com sucesso');
      } else {
        await webhooksManagementService.createEndpoint(webhookFormData);
        showSuccess('Endpoint criado com sucesso');
      }
      setWebhookFormOpen(false);
      setEditingEndpoint(null);
      setWebhookFormData({
        name: '',
        url: '',
        events: [],
        secret: '',
        active: true,
      });
      await loadWebhooksData();
    } catch (error: any) {
      console.error('[Settings] save webhook error', error);
      showError(error.message || 'Erro ao salvar endpoint');
    }
  };

  const handleTestEndpoint = async (endpointId: string) => {
    if (!isMaster) return;

    try {
      const result = await webhooksManagementService.testEndpoint(endpointId);
      if (result.success) {
        showSuccess('Teste realizado com sucesso');
      } else {
        showError(result.error || 'Falha no teste');
      }
    } catch (error: any) {
      console.error('[Settings] test webhook error', error);
      showError(error.message || 'Erro ao testar endpoint');
    }
  };

  const handleDeleteEndpointClick = (endpoint: any) => {
    setEndpointToDelete(endpoint);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!endpointToDelete) return;
    
    setDeleting(true);
    try {
      await webhooksManagementService.deleteEndpoint(endpointToDelete.id);
      showSuccess("Endpoint excluído com sucesso");
      setDeleteDialogOpen(false);
      setEndpointToDelete(null);
      await loadWebhooksData();
    } catch (error: any) {
      console.error("[Settings] delete endpoint error", error);
      showError(error.message || "Erro ao excluir endpoint");
    } finally {
      setDeleting(false);
    }
  };

  const WEBHOOK_EVENTS = webhooksManagementService.WEBHOOK_EVENTS;
  const WEBHOOK_EVENT_LABELS = webhooksManagementService.WEBHOOK_EVENT_LABELS;

  if (!isMaster) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas usuários Master podem acessar as configurações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="home_hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="home_hero">Banner Principal</TabsTrigger>
          <TabsTrigger value="promo_banner">Banner Promocional</TabsTrigger>
          <TabsTrigger value="ambiences">Ambientes</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Hero Tab */}
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

                <div className="space-y-2">
                  <Label>Imagem do Banner</Label>
                  
                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={uploadingHeroImage || savingHero}
                      className="flex-1"
                    >
                      {uploadingHeroImage ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Selecionar Imagem
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                    disabled={uploadingHeroImage || savingHero}
                  />
                  
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: JPG, PNG, WebP. Proporção recomendada: 2.7:1 (1920x700px).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">URL da Imagem</Label>
                  <Input
                    id="hero_image_url"
                    value={heroImageUrl}
                    onChange={(e) => {
                      setHeroImageUrl(e.target.value);
                      setHeroImageError(false);
                    }}
                    placeholder="https://exemplo.com/banner.jpg"
                    disabled={savingHero}
                  />
                  <p className="text-xs text-gray-500">
                    Você pode colar uma URL manualmente ou usar o upload acima.
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

        {/* Promo Banner Tab */}
        {isMaster && (
          <TabsContent value="promo_banner">
            <Card>
              <CardHeader>
                <CardTitle>Banner Promocional</CardTitle>
                <CardDescription>Banner opcional que aparece abaixo dos ambientes na home.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Imagem do Banner</Label>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => promoFileInputRef.current?.click()}
                      disabled={uploadingPromoImage || savingPromo}
                      className="flex-1"
                    >
                      {uploadingPromoImage ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Selecionar Imagem
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <input
                    ref={promoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePromoImageUpload}
                    className="hidden"
                    disabled={uploadingPromoImage || savingPromo}
                  />
                  
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: JPG, PNG, WebP.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo_image_url">URL da Imagem</Label>
                  <Input
                    id="promo_image_url"
                    value={promoImageUrl}
                    onChange={(e) => {
                      setPromoImageUrl(e.target.value);
                      setPromoImageError(false);
                    }}
                    placeholder="https://exemplo.com/banner.jpg"
                    disabled={savingPromo}
                  />
                  
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
                    placeholder="Descrição da imagem"
                    disabled={savingPromo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo_text">Texto do Banner</Label>
                  <Textarea
                    id="promo_text"
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    placeholder="Texto curto e impactante (opcional)"
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
                    Mostrar texto sobre a imagem
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
        )}

        {/* Ambiences Tab */}
        {isMaster && (
          <TabsContent value="ambiences">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ambientes</CardTitle>
                    <CardDescription>Gerencie os ambientes exibidos na home.</CardDescription>
                  </div>
                  <Button onClick={handleCreateAmbience}>
                    <ImageIcon size={16} className="mr-2" />
                    Novo Ambiente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ambiencesLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : ambiences.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum ambiente cadastrado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ambiences.map((ambience) => (
                      <div key={ambience.id} className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                              value={ambience.title}
                              onChange={(e) => handleUpdateAmbience(ambience.id, 'title', e.target.value)}
                              placeholder="Nome do ambiente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Slug da Categoria</Label>
                            <Input
                              value={ambience.category_slug}
                              onChange={(e) => handleUpdateAmbience(ambience.id, 'category_slug', e.target.value)}
                              placeholder="sala, quarto, etc."
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Imagem</Label>
                          <div className="flex gap-2">
                            <Input
                              value={ambience.image_url}
                              onChange={(e) => handleUpdateAmbience(id: ambience.id, 'image_url', e.target.value)}
                              placeholder="https://exemplo.com/ambiente.jpg"
                              className="flex-1"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAmbienceImageUpload(ambience.id, e)}
                              className="hidden"
                              id={`ambience-upload-${ambience.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById(`ambience-upload-${ambience.id}`)?.click()}
                            >
                              <Upload size={16} className="mr-2" />
                              Upload
                            </Button>
                          </div>
                          {ambience.image_url && (
                            <div className="mt-2">
                              <img
                                src={ambience.image_url}
                                alt={ambience.title}
                                className="w-full h-32 object-cover rounded-md"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={ambience.active}
                              onCheckedChange={(checked) => handleUpdateAmbience(ambience.id, 'active', checked)}
                            />
                            <Label className="cursor-pointer">Ativo</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Webhooks Tab */}
        {isMaster && (
          <TabsContent value="webhooks">
            <div className="space-y-6">
              {/* Webhook Form Dialog */}
              {webhookFormOpen && (
                <div className="mb-6 border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {editingEndpoint ? 'Editar Endpoint' : 'Novo Endpoint'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setWebhookFormOpen(false);
                        setEditingEndpoint(null);
                        setWebhookFormData({
                          name: '',
                          url: '',
                          events: [],
                          secret: '',
                          active: true,
                        });
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook_name">Nome</Label>
                      <Input
                        id="webhook_name"
                        value={webhookFormData.name}
                        onChange={(e) => setWebhookFormData({ ...webhookFormData, name: e.target.value })}
                        placeholder="Nome do webhook"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook_url">URL</Label>
                      <Input
                        id="webhook_url"
                        value={webhookFormData.url}
                        onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                        placeholder="https://exemplo.com/webhook"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Eventos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(WEBHOOK_EVENTS).map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`webhook-event-${event}`}
                              checked={webhookFormData.events.includes(event)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...webhookFormData.events, event]
                                  : webhookFormData.events.filter(ev => ev !== event);
                                setWebhookFormData({ ...webhookFormData, events: updated });
                              }}
                            />
                            <Label htmlFor={`webhook-event-${event}`} className="cursor-pointer">
                              {WEBHOOK_EVENT_LABELS[event as keyof typeof WEBHOOK_EVENT_LABELS] || event}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook_secret">Secret (Opcional)</Label>
                      <Input
                        id="webhook_secret"
                        type="password"
                        value={webhookFormData.secret}
                        onChange={(e) => setWebhookFormData({ ...webhookFormData, secret: e.target.value })}
                        placeholder="Chave secreta para validar webhooks"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="webhook_active"
                        checked={webhookFormData.active}
                        onCheckedChange={(checked) => setWebhookFormData({ ...webhookFormData, active: checked })}
                      />
                      <Label htmlFor="webhook_active" className="cursor-pointer">Ativo</Label>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setWebhookFormOpen(false);
                          setEditingEndpoint(null);
                          setWebhookFormData({
                            name: '',
                            url: '',
                            events: [],
                            secret: '',
                            active: true,
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveWebhook}>
                        {editingEndpoint ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Endpoints List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Endpoints</CardTitle>
                    <Button onClick={() => setWebhookFormOpen(true)}>
                      <ImageIcon size={16} className="mr-2" />
                      Novo Endpoint
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {webhooksLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                  ) : webhookEndpoints.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum endpoint configurado.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webhookEndpoints.map((endpoint) => (
                        <div key={endpoint.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{endpoint.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{endpoint.url}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestEndpoint(endpoint.id)}
                              >
                                Testar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEndpointClick(endpoint)}
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {endpoint.events.map((event: string) => (
                              <Badge key={event} variant="secondary">
                                {WEBHOOK_EVENT_LABELS[event as keyof typeof WEBHOOK_EVENT_LABELS] || event}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={endpoint.active}
                              onCheckedChange={(checked) => {
                                webhooksManagementService.updateEndpoint(endpoint.id, { active: checked })
                                  .then(() => {
                                    showSuccess('Endpoint atualizado');
                                    loadWebhooksData();
                                  })
                                  .catch((error) => {
                                    console.error('[Settings] update webhook error', error);
                                    showError(error.message || 'Erro ao atualizar endpoint');
                                  });
                              }}
                            />
                            <Label className="cursor-pointer text-sm">Ativo</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Logs Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Logs de Webhooks</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWebhookLogs(!showWebhookLogs)}
                      >
                        {showWebhookLogs ? 'Ocultar Logs' : 'Ver Logs'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadWebhooksData}
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showWebhookLogs && (
                    <>
                      {webhookLogsLoading ? (
                        <div className="text-center py-8 text-gray-500">Carregando logs...</div>
                      ) : webhookLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Nenhum log encontrado.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {webhookLogs.map((log) => (
                            <div key={log.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant={log.success ? 'default' : 'destructive'}>
                                    {log.success ? 'Sucesso' : 'Erro'}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {log.event_type}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-400">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                              {!log.success && log.error && (
                                <div className="text-sm text-red-600">
                                  {log.error}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Status: {log.status_code || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Alert open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Confirmar Exclusão</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Tem certeza que deseja excluir o endpoint <strong>"{endpointToDelete?.name}"</strong>?</p>
          <p className="text-sm text-gray-500">
            Esta ação não pode ser desfeita.
          </p>
        </AlertDescription>
        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Confirmar'}
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default Settings;