import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/core/auth/AuthProvider";
import { Role } from "@/constants/domain";
import { PermissionGate } from "@/core/guards/PermissionGate";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { RefreshCw, Image as ImageIcon, AlertCircle, Save, Loader2, Edit, ArrowUp, ArrowDown, Trash2, AlertTriangle, Plus, Upload, X, Megaphone } from "lucide-react";

import { homeHeroService, HomeHero } from "@/services/homeHeroService";
import { homeAmbiencesService, HomeAmbience } from "@/services/homeAmbiencesService";
import { homeAssetsService } from "@/services/homeAssetsService";
import { homePromoBannerService, HomePromoBanner } from "@/services/homePromoBannerService";
import { showError, showSuccess } from "@/utils/toast";

export default function SiteContent() {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  const [loading, setLoading] = useState(true);

  // Home Hero State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [savingHero, setSavingHero] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Ambiences State
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [ambienceEditModalOpen, setAmbienceEditModalOpen] = useState(false);
  const [editingAmbience, setEditingAmbience] = useState<HomeAmbience | null>(null);
  const [ambienceFormData, setAmbienceFormData] = useState({
    title: '',
    category_slug: '',
    image_url: '',
    active: true,
    sort_order: 0,
  });
  const [savingAmbience, setSavingAmbience] = useState(false);
  const [creatingAmbience, setCreatingAmbience] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ambienceToDelete, setAmbienceToDelete] = useState<HomeAmbience | null>(null);
  const [deletingAmbience, setDeletingAmbience] = useState(false);

  // Promo Banner State
  const [promoBannerFormData, setPromoBannerFormData] = useState({
    image_url: '',
    image_alt: '',
    text: '',
    show_text: true,
    active: true,
  });
  const [savingPromoBanner, setSavingPromoBanner] = useState(false);
  const [promoBannerImageError, setPromoBannerImageError] = useState(false);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);
  const promoFileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [hero, ambiencesData, promo] = await Promise.all([
        homeHeroService.getHomeHero(),
        homeAmbiencesService.listAllAmbiences(),
        homePromoBannerService.getPromoBanner(),
      ]);

      // Populate Hero State
      if (hero) {
        setHeroTitle(hero.title || '');
        setHeroHighlight(hero.highlight_word || '');
        setHeroImageUrl(hero.image_url || '');
        setHeroImageAlt(hero.image_alt || '');
      }

      // Populate Ambiences State
      setAmbiences(ambiencesData);

      // Populate Promo Banner State
      if (promo) {
        setPromoBannerFormData({
          image_url: promo.image_url || '',
          image_alt: promo.image_alt || '',
          text: promo.text || '',
          show_text: promo.show_text ?? true,
          active: promo.active ?? true,
        });
      }
    } catch (e) {
      console.error("[SiteContent] loadData error", e);
      showError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Home Hero Handlers
  const handleSaveHero = async () => {
    setSavingHero(true);
    try {
      await homeHeroService.upsertHomeHero({
        title: heroTitle,
        highlight_word: heroHighlight,
        image_url: heroImageUrl,
        image_alt: heroImageAlt,
      });
      showSuccess("Banner atualizado com sucesso");
    } catch (error: any) {
      console.error("[SiteContent] save hero error", error);
      showError(error.message || "Erro ao salvar banner");
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
      console.error("[SiteContent] hero image upload error", error);
      showError(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingHeroImage(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  // Ambiences Handlers
  const handleOpenAmbienceEditModal = (ambience: HomeAmbience) => {
    setEditingAmbience(ambience);
    setAmbienceFormData({
      title: ambience.title,
      category_slug: ambience.category_slug,
      image_url: ambience.image_url,
      active: ambience.active,
      sort_order: ambience.sort_order,
    });
    setAmbienceEditModalOpen(true);
  };

  const handleSaveAmbience = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAmbience) return;
    
    if (!ambienceFormData.title.trim()) {
      showError("Título é obrigatório");
      return;
    }
    
    if (!ambienceFormData.category_slug.trim()) {
      showError("Slug da categoria é obrigatório");
      return;
    }
    
    if (!ambienceFormData.image_url.trim()) {
      showError("URL da imagem é obrigatória");
      return;
    }
    
    setSavingAmbience(true);
    try {
      await homeAmbiencesService.updateAmbience(editingAmbience.id, {
        title: ambienceFormData.title,
        category_slug: ambienceFormData.category_slug,
        image_url: ambienceFormData.image_url,
        active: ambienceFormData.active,
        sort_order: ambienceFormData.sort_order,
      });
      showSuccess("Ambiente atualizado com sucesso");
      setAmbienceEditModalOpen(false);
      setEditingAmbience(null);
      setAmbienceFormData({
        title: '',
        category_slug: '',
        image_url: '',
        active: true,
        sort_order: 0,
      });
      await loadData();
    } catch (error: any) {
      console.error("[SiteContent] save ambience error", error);
      showError(error.message || "Erro ao salvar ambiente");
    } finally {
      setSavingAmbience(false);
    }
  };

  const handleAmbienceToggleActive = async (ambience: HomeAmbience) => {
    try {
      await homeAmbiencesService.updateAmbience(ambience.id, {
        active: !ambience.active,
      });
      showSuccess(ambience.active ? "Ambiente desativado" : "Ambiente ativado");
      await loadData();
    } catch (error: any) {
      console.error("[SiteContent] toggle ambience active error", error);
      showError(error.message || "Erro ao atualizar ambiente");
    }
  };

  const handleMoveAmbience = async (ambience: HomeAmbience, direction: 'up' | 'down') => {
    const currentIndex = ambiences.findIndex(a => a.id === ambience.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= ambiences.length) return;

    const targetAmbience = ambiences[newIndex];

    try {
      await Promise.all([
        homeAmbiencesService.updateAmbience(ambience.id, { sort_order: targetAmbience.sort_order }),
        homeAmbiencesService.updateAmbience(targetAmbience.id, { sort_order: ambience.sort_order }),
      ]);
      showSuccess("Ordem atualizada");
      await loadData();
    } catch (error: any) {
      console.error("[SiteContent] move ambience error", error);
      showError(error.message || "Erro ao atualizar ordem");
    }
  };

  const handleCreateAmbience = async () => {
    setCreatingAmbience(true);
    try {
      const newAmbience = await homeAmbiencesService.createHomeAmbience();
      showSuccess("Ambiente criado com sucesso");
      await loadData();
      handleOpenAmbienceEditModal(newAmbience);
    } catch (error: any) {
      console.error("[SiteContent] create ambience error", error);
      showError(error.message || "Erro ao criar ambiente");
    } finally {
      setCreatingAmbience(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await homeAssetsService.uploadAmbienceImage(file);
      setAmbienceFormData(prev => ({ ...prev, image_url: publicUrl }));
      showSuccess("Imagem enviada com sucesso");
    } catch (error: any) {
      console.error("[SiteContent] image upload error", error);
      showError(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete Handlers
  const handleDeleteClick = (ambience: HomeAmbience) => {
    setAmbienceToDelete(ambience);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ambienceToDelete) return;

    setDeletingAmbience(true);
    try {
      await homeAmbiencesService.deleteHomeAmbience(ambienceToDelete.id, ambienceToDelete.image_url);
      showSuccess("Ambiente excluído com sucesso");
      setDeleteDialogOpen(false);
      setAmbienceToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("[SiteContent] delete ambience error", error);
      showError(error.message || "Erro ao excluir ambiente");
    } finally {
      setDeletingAmbience(false);
    }
  };

  // Promo Banner Handlers
  const handleSavePromoBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promoBannerFormData.image_url.trim()) {
      showError("URL da imagem é obrigatória");
      return;
    }

    setSavingPromoBanner(true);
    try {
      await homePromoBannerService.upsertPromoBanner({
        image_url: promoBannerFormData.image_url,
        image_alt: promoBannerFormData.image_alt,
        text: promoBannerFormData.text,
        show_text: promoBannerFormData.show_text,
        active: promoBannerFormData.active,
      });
      showSuccess("Banner promocional atualizado com sucesso");
    } catch (error: any) {
      console.error("[SiteContent] save promo banner error", error);
      showError(error.message || "Erro ao salvar banner promocional");
    } finally {
      setSavingPromoBanner(false);
    }
  };

  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPromoImage(true);
    try {
      const publicUrl = await homeAssetsService.uploadPromoImage(file);
      setPromoBannerFormData(prev => ({ ...prev, image_url: publicUrl }));
      setPromoBannerImageError(false);
      showSuccess("Imagem enviada com sucesso");
    } catch (error: any) {
      console.error("[SiteContent] promo image upload error", error);
      showError(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingPromoImage(false);
      if (promoFileInputRef.current) {
        promoFileInputRef.current.value = '';
      }
    }
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
          <h1 className="text-2xl font-bold">Conteúdo do Site</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie o conteúdo exibido na página inicial</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="home_hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="home_hero"><ImageIcon size={16} className="mr-2" />Home Hero</TabsTrigger>
          <TabsTrigger value="ambientes_home"><ImageIcon size={16} className="mr-2" />Ambientes</TabsTrigger>
          <TabsTrigger value="promo_banner"><Megaphone size={16} className="mr-2" />Banner Promocional</TabsTrigger>
        </TabsList>

        {/* Home Hero Tab */}
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
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                  disabled={uploadingHeroImage || savingHero}
                />
                <p className="text-xs text-gray-500">
                  Proporção recomendada: 2.7:1 (1920x700px).
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
                  placeholder="https://exemplo.com/imagem.jpg"
                  disabled={savingHero}
                />
                
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

        {/* Ambientes Tab */}
        <TabsContent value="ambientes_home">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ambientes da Home</CardTitle>
                  <CardDescription>Configure os ambientes exibidos na página inicial.</CardDescription>
                </div>
                <Button onClick={handleCreateAmbience} disabled={creatingAmbience}>
                  <Plus size={16} className="mr-2" />
                  Novo Ambiente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ambiences.length === 0 ? (
                <div className="text-gray-500 py-8 text-center">Nenhum ambiente cadastrado.</div>
              ) : (
                <div className="space-y-4">
                  {ambiences.map((ambience, index) => (
                    <div key={ambience.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold">{ambience.title}</div>
                            <Badge variant={ambience.active ? "default" : "secondary"}>{ambience.active ? "Ativo" : "Inativo"}</Badge>
                            <Badge variant="outline" className="text-xs">Ordem: {ambience.sort_order}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="text-gray-500">Categoria:</span> {ambience.category_slug}
                          </div>
                          <div className="text-xs text-gray-500 font-mono break-all">
                            {ambience.image_url}
                          </div>
                          
                          {ambience.image_url && (
                            <div className="mt-3">
                              <img
                                src={ambience.image_url}
                                alt={ambience.title}
                                className="w-full h-32 object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAmbienceToggleActive(ambience)}
                              title={ambience.active ? "Desativar" : "Ativar"}
                            >
                              {ambience.active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAmbienceEditModal(ambience)}
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(ambience)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir ambiente"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </Button>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveAmbience(ambience, 'up')}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              <ArrowUp size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveAmbience(ambience, 'down')}
                              disabled={index === ambiences.length - 1}
                              title="Mover para baixo"
                            >
                              <ArrowDown size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Banner Tab */}
        <TabsContent value="promo_banner">
          <Card>
            <CardHeader>
              <CardTitle>Banner Promocional</CardTitle>
              <CardDescription>Configure o banner promocional exibido na página inicial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSavePromoBanner}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Imagem do Banner</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => promoFileInputRef.current?.click()}
                        disabled={uploadingPromoImage || savingPromoBanner}
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
                      disabled={uploadingPromoImage || savingPromoBanner}
                    />
                    <p className="text-xs text-gray-500">
                      Proporção recomendada: 16:9 (1920x1080px).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo_image_url">URL da Imagem</Label>
                    <Input
                      id="promo_image_url"
                      value={promoBannerFormData.image_url}
                      onChange={(e) => {
                        setPromoBannerFormData({ ...promoBannerFormData, image_url: e.target.value });
                        setPromoBannerImageError(false);
                      }}
                      placeholder="https://exemplo.com/banner.jpg"
                      disabled={savingPromoBanner}
                    />
                    
                    {promoBannerFormData.image_url && (
                      <div className="mt-2 border rounded-md overflow-hidden bg-gray-50">
                        <img
                          src={promoBannerFormData.image_url}
                          alt="Preview"
                          className="w-full h-40 object-cover"
                          onError={() => setPromoBannerImageError(true)}
                          style={{ display: promoBannerImageError ? 'none' : 'block' }}
                        />
                        {promoBannerImageError && (
                          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
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
                      value={promoBannerFormData.image_alt}
                      onChange={(e) => setPromoBannerFormData({ ...promoBannerFormData, image_alt: e.target.value })}
                      placeholder="Descrição da imagem para acessibilidade"
                      disabled={savingPromoBanner}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promo_text">Texto do Banner</Label>
                    <Input
                      id="promo_text"
                      value={promoBannerFormData.text}
                      onChange={(e) => setPromoBannerFormData({ ...promoBannerFormData, text: e.target.value })}
                      placeholder="Ex: Promoção de Verão!"
                      disabled={savingPromoBanner}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="promo_show_text"
                      checked={promoBannerFormData.show_text}
                      onCheckedChange={(checked) => setPromoBannerFormData({ ...promoBannerFormData, show_text: checked })}
                      disabled={savingPromoBanner}
                    />
                    <Label htmlFor="promo_show_text" className="cursor-pointer">
                      Mostrar texto sobre a imagem
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="promo_active"
                      checked={promoBannerFormData.active}
                      onCheckedChange={(checked) => setPromoBannerFormData({ ...promoBannerFormData, active: checked })}
                      disabled={savingPromoBanner}
                    />
                    <Label htmlFor="promo_active" className="cursor-pointer">
                      Banner Ativo
                    </Label>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={savingPromoBanner}>
                      {savingPromoBanner ? (
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
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ambiences Edit Modal */}
      <Dialog open={ambienceEditModalOpen} onOpenChange={setAmbienceEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Ambiente</DialogTitle>
            <DialogDescription>
              Altere os dados do ambiente exibido na Home.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAmbience} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ambience_title">Título *</Label>
              <Input
                id="ambience_title"
                value={ambienceFormData.title}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, title: e.target.value })}
                placeholder="Ex: Sala de Estar"
                disabled={savingAmbience}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambience_category_slug">Slug da Categoria *</Label>
              <Input
                id="ambience_category_slug"
                value={ambienceFormData.category_slug}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, category_slug: e.target.value })}
                placeholder="Ex: sala, quarto, cozinha"
                disabled={savingAmbience}
                required
              />
              <p className="text-xs text-gray-500">
                Este slug será usado para filtrar produtos no catálogo.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Imagem do Ambiente</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || savingAmbience}
                  className="flex-1"
                >
                  {uploadingImage ? (
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage || savingAmbience}
              />
              <p className="text-xs text-gray-500">
                Proporção recomendada: 4:3 (1200x900px).
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
                required
              />
              
              {ambienceFormData.image_url && (
                <div className="mt-2 border rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={ambienceFormData.image_url}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambience_sort_order">Ordem de Exibição</Label>
              <Input
                id="ambience_sort_order"
                type="number"
                min="0"
                max="99"
                value={ambienceFormData.sort_order}
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, sort_order: parseInt(e.target.value) || 0 })}
                disabled={savingAmbience}
                required
              />
              <p className="text-xs text-gray-500">
                Menor valor aparece primeiro.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ambience_active"
                checked={ambienceFormData.active}
                onCheckedChange={(checked) => setAmbienceFormData({ ...ambienceFormData, active: checked })}
                disabled={savingAmbience}
              />
              <Label htmlFor="ambience_active" className="cursor-pointer">
                Ambiente Ativo
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAmbienceEditModalOpen(false);
                  setEditingAmbience(null);
                  setAmbienceFormData({
                    title: '',
                    category_slug: '',
                    image_url: '',
                    active: true,
                    sort_order: 0,
                  });
                }}
                disabled={savingAmbience}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingAmbience}>
                {savingAmbience ? (
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Ambiente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o ambiente <strong>"{ambienceToDelete?.title}"</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogCancel onClick={() => setDeleteDialogOpen(false)} disabled={deletingAmbience}>
              Cancelar
            </DialogCancel>
            <DialogAction
              onClick={handleConfirmDelete}
              disabled={deletingAmbience}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingAmbience ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}