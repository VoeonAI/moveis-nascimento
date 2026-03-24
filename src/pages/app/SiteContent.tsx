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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogCancel, DialogAction } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { RefreshCw, Image as ImageIcon, AlertCircle, Save, Loader2, Key, Plus, Edit, Trash2, X, ArrowUp, ArrowDown, Upload, Megaphone, Users } from "lucide-react";

import {
  webhooksManagementService,
  WebhookEndpoint,
  WebhookLog,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENTS,
} from "@/services/webhooksManagementService";
import { settingsService } from "@/services/settingsService";
import { agentTokensService, AgentToken } from "@/services/agentTokensService";
import { homeHeroService } from "@/services/homeHeroService";
import { homeAmbiencesService, HomeAmbience } from "@/services/homeAmbiencesService";
import { homeAssetsService } from "@/services/homeAssetsService";
import { homePromoBannerService, HomePromoBanner } from "@/services/homePromoBannerService";
import { installersService, Installer } from "@/services/installersService";
import { showError, showSuccess } from "@/utils/toast";

export default function SiteContent() {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  const [loading, setLoading] = useState(true);

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [agentTokens, setAgentTokens] = useState<AgentToken[]>([]);
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [promoBanner, setPromoBanner] = useState<HomePromoBanner | null>(null);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loadingInstallers, setLoadingInstallers] = useState(false);

  const [storeWhatsApp, setStoreWhatsApp] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  // Webhook creation/edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    active: true,
    events: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [endpointToDelete, setEndpointToDelete] = useState<WebhookEndpoint | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Home Hero State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [savingHero, setSavingHero] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  // Ambiences Edit State
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

  // Creating new ambience state
  const [creatingAmbience, setCreatingAmbience] = useState(false);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Promo Banner State
  const [promoBannerFormData, setPromoBannerFormData] = useState({
    image_url: '',
    image_alt: '',
    text: '',
    list_text: true,
    active: true,
  });
  const [savingPromoBanner, setSavingPromoBanner] = useState(false);
  const [promoBannerImageError, setPromoBannerImageError] = useState(false);
  const [uploadingPromoImage, setUploadingPromoImage] = useState(false);
  const promoFileInputRef = useRef<HTMLInputElement>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const projectRef = useMemo(() => {
    return supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "<project-ref>";
  }, [supabaseUrl]);

  const functionsBaseUrl = "https://" + projectRefase + ".supabase.co/functions/v1";
  const searchUrl = functionsBaseUrl + "/agent_products_search";
  const productUrl = functionsBaseUrl + "/agent_product_by_id";

  const curlCategoryExample = 'curl -X GET "' + searchUrl + '?category=guarda-roupa&limit=10" -H "x-agent-token: <AGENT_TOKEN>"';
  const curlTextExample = 'curl -X GET "' + searchUrl + '?q=guarda%20roupa&limit=10" -H "x-agent-token: <AGENT_TOKEN>"';
  const curlIdExample = 'curl -X GET "' + productUrl + '?id=uuid-do-produto" -H "x-agent-token: <AGENT_TOKEN>"';

  const n8nConfig = {
    method: "GET",
    url: searchUrl,
    queryParameters: { category: "guarda-roupa", limit: 10 },
    headers: { "x-agent-token": "{{$env.AGENT_TOKEN}}" },
  };

  const envelopeConfig = {
    version: "1.0",
    event_type: "lead.created",
    event_id: "uuid",
    occurred_at: "2024-01-01T00:00:00Z",
    source: { app: "moveis-nascimento", env: "production", channel: "site" },
    data: {},
    meta: {},
  };

  const n8nExample = JSON.stringify(n8nConfig, null, 2);
  const envelopeExample = JSON.stringify(envelopeConfig, null, 2);

  // Find first active token
  const activeToken = agentTokens.find(t => t.active);

  // Mask token for display (show first 4 and last 4 chars)
  const maskToken = (token: string) => {
    if (!token || token.length < 8) return token;
    return token.slice(0, 4) + "..." + token.slice(-4);
  };

  async function loadData() {
    setLoading(true);
    try {
      const [eps, lgs, wa, tokens, hero, ambiences, promo] = await Promise.all([
        webhooksManagementService.listEndpoints(),
        isMaster ? webhooksManagementService.listLogs(100) : Promise.resolve([]),
        isMaster ? settingsService.getStoreWhatsApp() : Promise.resolve(null),
        isMaster ? agentTokensService.listTokens() : Promise.resolve([]),
        isMaster ? homeHeroService.getHomeHero() : Promise.resolve(null),
        isMaster ? homeAmbiencesService.listAllAmbiences() : Promise.resolve([]),
        isMaster ? homePromoBannerService.getPromoBanner() : Promise.resolve(null),
      ]);
      setEndpoints(eps);
      setLogs(lgs);
      setAgentTokens(tokens);
      setStoreWhatsApp(wa ?? "");
      setWhatsappSaved(Boolean(wa));

      // Populate Hero State
      if (hero) {
        setHeroTitle(hero.title || '');
        setHeroHighlight(hero.highlight_word || '');
        setHeroImageUrl(hero.image_url || '');
        setHeroImageAlt(hero.image_alt || '');
      }

      // Populate Ambiences State
      setAmbiences(ambiences);

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
      showError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  async function loadInstallers() {
    setLoadingInstallers(true);
    try {
      const data = await installersService.getActiveInstallers();
      setInstallers(data);
    } catch (e) {
      console.error("[SiteContent] loadInstallers error", e);
      showError("Erro ao carregar montadores");
    } finally {
      setLoadingInstallers(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showSuccess("Copiado");
  }

  async function handleSaveWhatsApp() {
    if (storeWhatsApp && !/^\d{10,15}$/.test(storeWhatsApp)) {
      showError("Formato inválido. Use apenas números (10-15 dígitos). Ex: 5511999999999");
      return;
    }
    setSavingWhatsApp(true);
    try {
      await settingsService.setStoreWhatsApp(storeWhatsApp);
      setWhatsappSaved(true);
      showSuccess("WhatsApp atualizado");
    } catch (e: any) {
      console.error("[SiteContent] save WhatsApp error", e);
      setWhatsappSaved(false);
      showError(e?.message || "Erro ao salvar WhatsApp");
    } finally {
      setSavingWhatsApp(false);
    }
  }

  const handleOpenCreateModal = () => {
    setEditingEndpoint(null);
    setFormData({
      name: '',
      url: '',
      active: true,
      events: [],
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      url: endpoint.url,
      active: endpoint.active,
      events: endpoint.events,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError("Nome é obrigatório");
      return;
    }
    
    if (!formData.url.trim()) {
      showError("URL é obrigatória");
      return;
    }
    
    if (formData.events.length === 0) {
      showError("Selecione pelo menos um evento");
      return;
    }
    
    setSaving(true);
    try {
      if (editingEndpoint) {
        await webhooksManagementService.updateEndpoint(editingEndpoint.id, {
          name: formData.name,
          url: formData.url,
          active: formData.active,
          events: formData.events,
        });
        showSuccess("Endpoint atualizado com sucesso");
      } else {
        await webhooksManagementService.createEndpoint({
          name: formData.name,
          url: formData.url,
          active: formData.active,
          events: formData.events,
          secret: undefined,
        });
        showSuccess("Endpoint criado com sucesso");
      }
      
      setModalOpen(false);
      setEditingEndpoint(null);
      setFormData({
        name: '',
        url: '',
        active: true,
        events: [],
      });
      await loadData();
    } catch (error: any) {
      console.error("[SiteContent] save endpoint error", error);
      showError(error.message || "Erro ao salvar endpoint");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (endpoint: WebhookEndpoint) => {
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
      await loadData();
    } read (error: any) {
      console.error("[SiteContent] delete endpoint error", error);
      showError(error.message || "Erro ao excluir endpoint");
    } finally {
      setDeleting(false);
    }
  };

  const toggleEvent = (eventKey: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventKey)
        ? prev.events.filter(e => e !== eventKey)
        : [...prev.events, eventKey],
    }));
  };

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
      showSuccess("Banner principal atualizado com sucesso!");
    } catch (error: any) {
      console.error("[SiteContent] save hero error", error);
      showError(error.message || "Erro ao salvar banner");
    } finally {
      setSavingHero(false);
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
      showSuccess("Ambiente atualizado com sucesso!");
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
      // Swap sort_order values
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
      // Abrir modal de edição automaticamente
      handleOpenAmbienceEditModal(newAmbience);
    } catch (error: any) {
      console.error("[SiteContent] create ambience error", error);
      showError(error.message || "Erro ao criar ambiente");
    } finally {
      setCreatingAmbience(false);
    }
  };

  // Image Upload Handler (Ambiences)
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
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      showSuccess("Banner promocional atualizado com sucesso!");
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie webhooks, integrações, APIs e o banner principal</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw size={16} "mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks"><Globe size={16} className="mr-2" />Webhooks</TabsTrigger>
          {isMaster && <TabsTrigger value="home_hero"><ImageIcon size={16} className="mr-2" />Home Hero</TabsTrigger>}
          {isMaster && <TabsTrigger value="promo_banner"><Megaphone size={16} className="mr-2" />Banner Promocional</TabsTrigger>}
          {isMaster && <TabsTrigger value="ambientes_home"><ImageIcon size={16} className="mr-2" />Ambientes</TabsTrigger>}
          {isMaster && <TabsTrigger value="montadores"><Users size={16} className="mr-2" />Montadores</TabsTrigger>}
          {isMaster && <TabsTrigger value="whatsapp"><Phone size={16} className="mr-2" />WhatsApp</TabsTrigger>}
          {isMaster && <TabsTrigger value="apis"><Code size={16} className="mr-2" />APIs</TabsTrigger>}
          {isMaster && <TabsTrigger value="logs"><Clock size={16} className="mr-2" />Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Configure endpoints para receber notificações de eventos</CardDescription>
                </div>
                <PermissionGate allowedRoles={[Role.MASTER]}>
                  <Button onClick={handleOpenCreateModal}>
                    <Plus size={16} className="mr-2" />
                    Novo Endpoint
                  </Button>
                </PermissionGate>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-gray-500 py-8">Carregando...</div>
              ) : endpoints.length === 0 ? (
                <div className="text-gray-500 py-8">Nenhum webhook configurado.</div>
              ) : (
                <div className="space-y-3">
                  {endpoints.map((ep) => (
                    <div key={ep.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold">{ep.name}</div>
                            <Badge variant={ep.active ? "default" : "secondary"}>{ep.active ? "Ativo" : "Inativo"}</Badge>
                          </div>
                          <div className="text-xs text-gray-600 font-mono break-all">{ep.url}</div>
                        </div>
                        <PermissionGate allowedRoles={[Role.MASTER]}>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(ep)}
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(ep)}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </PermissionGate>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {ep.events.map((evt) => (
                          <Badge key={evt} variant="outline" className="text-xs">
                            {WEBHOOK_EVENT_LABELS[evt as keyof typeof WEBHOOK_EVENT_LABELS] || evt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

                <div callName="space-y-2">
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

        {isMaster && (
          <TabsContent value="promo_banner">
            <Card>
              <CardHeader>
                <CardTitle>Banner Promocional</CardTitle>
                <CardDescription>Configure o banner promocional exibido na página inicial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSavePromoBanner}>
                  <div className="space-y-4">
                    {/* Imagem */}
                    <div className="space-y-2">
                      <Label>Imagem do Banner</Label>
                      
                      {/* Upload Button */}
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
                      
                      {/* Hidden File Input */}
                      <input
                        ref={promoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePromoImageUpload}
                        className="hidden"
                        disabled={uploadingPromoImage || savingPromoBanner}
                      />
                      
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: JPG, PNG, WebP. Proporção recomendada: 16:9 (1920x1080px).
                      </p>
                    </div>

                    {/* URL da Imagem */}
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
                      <p className="text-xs text-gray-500">
                        Você pode colar uma URL manualmente ou usar o upload acima.
                      </p>
                      
                      {/* Preview da Imagem */}
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

                    {/* Texto Alternativo (Alt) */}
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

                    {/* Texto do Banner */}
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

                    {/* Mostrar Texto */}
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

                    {/* Ativo */}
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

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPromoBannerFormData({
                            image_url: '',
                            image_alt: '',
                            text: '',
                            show_text: true,
                            active: true,
                          });
                        }}
                        disabled={savingPromoBanner}
                      >
                        Cancelar
                      </Button>
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
        )}

        {isMaster && (
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
                {loading ? (
                  <div className="text-gray-500 py-8">Carregando...</div>
                ) : ambiences.length === 0 ? (
                  <div className="text-gray-500 py-8 text-center">
                    Nenhum ambiente cadastrado. Clique em "Novo Ambiente" para adicionar o primeiro.
                  </div>
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
                              <only className="text-gray-500">Categoria:</span> {ambience.category_slug}
                            </div>
                            <div className="text-xs text-gray-500 font-mono break-all">
                              {ambience.image_url}
                            </div>
                            
                            {/* Preview da Imagem */}
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
        )}

        {isMaster && (
          <TabsContent value="montadores">
            <Card>
              <CardHeader>
                <CardTitle>Montadores</CardTitle>
                <CardDescription>Visualize os montadores cadastrados no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInstallers ? (
                  <div className="text-gray-500 py-8">Carregando montadores...</div>
                ) : installers.length === 0 ? (
                  <div className="text-gray-500 py-8 text-center">
                    Nenhum montador cadastrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {installers.map((installer) => (
                      <div key={installer.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-semibold">{installer.name}</div>
                              <Badge variant={installer.active ? "default" : "secondary"}>
                                {installer.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="text-gray-500">Telefone:</span> {installer.phone}
                            </div>
                            {installer.city && (
                              <div className="text-sm text-gray-600">
                                <span className="text-gray-500">Cidade:</span> {installer.city}
                              </div>
                            )}
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

        {isMaster && (
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp da Loja</CardTitle>
                <CardDescription>Configure o número WhatsApp para receber mensagens de interesse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store_whatsapp">Número WhatsApp (E.164)</Label>
                  <Input
                    id="store_whatsapp"
                    value={storeWhatsApp}
                    onChange={(e) => { setStoreWhatsApp(e.target.value.replace(/\D/g, "")); setWhatsappSaved(false); }}
                    placeholder="5511999999999"
                    maxLength={15}
                    disabled={savingWhatsApp}
                  />
                  <p className="text-sm text-gray-500">Ex: 5511999999999 (somente números, com DDI + DDD)</p>
                </div>

                <Button onClick={handleSaveWhatsApp} disabled={savingWhatsApp}>
                  {savingWhatsApp ? (<><Loader2 size={16} className="mr-2 animate-spin" />Salvando...</>) : (<><Save size={16} className="mr-2" />Salvar</>)}
                </Button>

                {whatsappSaved && storeWhatsApp && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">Configurado</div>
                    <div className="text-sm text-green-700 mt-1">
                      O número <span className="font-mono">{storeWhatsApp}</span> será usado para redirecionar mensagens de interesse.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isMaster && (
          <TabsContent value="apis">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Catalog API</CardTitle>
                  <CardDescription>API para o agente buscar produtos do catálogo</CardDescription>
                </div>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Base URL</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm flex items-center justify-between">
                      <code>{functionsBaseUrl}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(functionsBaseUrl)}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Exemplos cURL</Label>
                    <div className="mt-2 space-y-2">
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{curlCategoryExample}</pre>
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{curlTextExample}</pre>
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{curlIdExample}</pre>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(curlCategoryExample)}>
                        <Copy size={14} className="mr-2" />Copiar cURL (categoria)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Exemplo n8n (HTTP Request Node)</Label>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto mt-2">{n8nExample}</pre>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(n8nExample)}>
                      <Copy size={14} className="mr-2" />Copiar JSON n8n
                    </Button>
                  </div>

                  <div>
                    <Label>Tokens do Agente</Label>
                    <div className="mt-2">
                      {activeToken ? (
                        <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <Key size={16} className="text-gray-500" />
                            <span className="font-medium">{activeToken.name}</span>
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Token:</span>
                            <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">{maskToken(activeToken.token_hash)}</code>
                            <Button variant="hook" size="sm" onClick={() => copyToClipboard(activeToken.token_hash)}>
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {agentTokens.length === 0 ? "Nenhum token listado (ok por enquanto)." : "Nenhum token ativo encontrado."}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Envelope v1 e roteamento por event_type no n8n</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label>Payload Envelope v1</Label>
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{envelopeExample}</pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {isMaster && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Webhooks</CardTitle>
                <CardDescription>Histórico de envios</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-500 py-8">Carregando...</div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-500 py-8">Nenhum log encontrado.</div>
                ) : (
                  <div className="space-y-3">
                    {logs.slice(0, 30).map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {WEBHOOK_EVENT_LABELS[log.event_type as keyof typeof WEBHOOK_EVENT_LABELS] || log.event_type}
                          </div>
                          <Badge variant={log.success ? "default" : "destructive"}>{log.status_code ?? "Erro"}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{log.created_at}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Webhook Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? 'Editar Endpoint de Webhook' : 'Novo Endpoint de Webhook'}</DialogTitle>
            <DialogDescription>
              {editingEndpoint ? 'Altere as configurações do endpoint.' : 'Configure um novo endpoint para receber notificações de eventos.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_name">Nome *</Label>
              <Input
                id="webhook_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Integração n8n"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL *</Label>
              <Input
                id="webhook_url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://seu-endpoint.com/webhook"
                disabled={saving}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="webhook_active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                disabled={saving}
              />
              <Label htmlFor="webhook_active" className="cursor-pointer">
                Ativo
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="space-y-2">
                {Object.entries(WEBHOOK_EVENTS).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`event_${key}`}
                      checked={formData.events.includes(value)}
                      onCheckedChange={() => toggleEvent(value)}
                      disabled={saving}
                    />
                    <Label htmlFor={`event_${key}`} className="cursor-pointer">
                      {WEBHOOK_EVENT_LABELS[value as keyof typeof WEBHOOK_EVENT_LABELS] || value}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setEditingEndpoint(null);
                  setFormData({
                    name: '',
                    url: '',
                    active: true,
                    events: [],
                  });
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingEndpoint ? 'Salvar alterações' : 'Criar Endpoint'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir endpoint de webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o endpoint e ele não receberá mais eventos.
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
                onChange={(e) => setAmbienceFormData({ ...ambienceFormData, ambience_category_slug: e.target.value })}
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
              
              {/* Upload Button */}
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
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage || savingAmbience}
              />
              
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, WebP. Proporção recomendada: 4:3 (1200x900px).
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
              <p className="text-xs text-gray-500">
                Você pode colar uma URL manualmente ou usar o upload acima.
              </p>
              
              {/* Preview da Imagem */}
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
              state
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
    </div>
  );
}