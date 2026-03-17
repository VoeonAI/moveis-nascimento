import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeService, HomeConfig } from '@/services/homeService';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { PermissionGate } from '@/core/guards/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/core/supabaseClient';

const AdminHome = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlightWord, setHeroHighlightWord] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);

  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoText, setPromoText] = useState('');
  const [promoImageUrl, setPromoImageUrl] = useState('');
  const [promoImageFile, setPromoImageFile] = useState<File | null>(null);
  const [promoUploading, setPromoUploading] = useState(false);

  // Ambiences state
  const [ambiences, setAmbiences] = useState<HomeConfig['ambiences']>([]);
  const [newAmbienceTitle, setNewAmbienceTitle] = useState('');
  const [newAmbienceSlug, setNewAmbienceSlug] = useState('');
  const [newAmbienceImageFile, setNewAmbienceImageFile] = useState<File | null>(null);
  const [newAmbienceUploading, setNewAmbienceUploading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await homeService.getHomeConfig();
      if (data) {
        setConfig(data);
        setHeroTitle(data.hero_title || '');
        setHeroHighlightWord(data.hero_highlight_word || '');
        setHeroImageUrl(data.hero_image_url || '');
        setPromoEnabled(data.promo_enabled || false);
        setPromoText(data.promo_text || '');
        setPromoImageUrl(data.promo_image_url || '');
        setAmbiences(data.ambiences || []);
      }
    } catch (error) {
      console.error('[AdminHome] Failed to load config:', error);
      showError('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async () => {
    if (!heroImageFile) return;

    setHeroUploading(true);
    try {
      const fileName = `hero-${Date.now()}-${heroImageFile.name}`;
      const filePath = `home/${fileName}`;

      const { error } = await supabase.storage
        .from('home')
        .upload(filePath, heroImageFile, {
          upsert: true,
          contentType: heroImageFile.type,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('home')
        .getPublicUrl(filePath);

      setHeroImageUrl(data.publicUrl);
      setHeroImageFile(null);
      showSuccess('Imagem do Hero carregada com sucesso');
    } catch (error) {
      console.error('[AdminHome] Failed to upload hero image:', error);
      showError('Erro ao carregar imagem do Hero');
    } finally {
      setHeroUploading(false);
    }
  };

  const handlePromoImageUpload = async () => {
    if (!promoImageFile) return;

    setPromoUploading(true);
    try {
      const fileName = `promo-${Date.now()}-${promoImageFile.name}`;
      const filePath = `home/${fileName}`;

      const { error } = await supabase.storage
        .from('home')
        .upload(filePath, promoImageFile, {
          upsert: true,
          contentType: promoImageFile.type,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('home')
        .getPublicUrl(filePath);

      setPromoImageUrl(data.publicUrl);
      setPromoImageFile(null);
      showSuccess('Imagem promocional carregada com sucesso');
    } catch (error) {
      console.error('[AdminHome] Failed to upload promo image:', error);
      showError('Erro ao carregar imagem promocional');
    } finally {
      setPromoUploading(false);
    }
  };

  const handleAddAmbience = async () => {
    if (!newAmbienceTitle.trim() || !newAmbienceSlug.trim()) {
      showError('Título e slug são obrigatórios');
      return;
    }

    if (!newAmbienceImageFile) {
      showError('Imagem é obrigatória');
      return;
    }

    setNewAmbienceUploading(true);
    try {
      const fileName = `ambience-${Date.now()}-${newAmbienceImageFile.name}`;
      const filePath = `home/${fileName}`;

      const { error } = await supabase.storage
        .from('home')
        .upload(filePath, newAmbienceImageFile, {
          upsert: true,
          contentType: newAmbienceImageFile.type,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('home')
        .getPublicUrl(filePath);

      const newAmbience = {
        id: crypto.randomUUID(),
        title: newAmbienceTitle,
        category_slug: newAmbienceSlug,
        image_url: data.publicUrl,
      };

      setAmbiences([...ambiences, newAmbience]);
      setNewAmbienceTitle('');
      setNewAmbienceSlug('');
      setNewAmbienceImageFile(null);
      showSuccess('Ambiente adicionado com sucesso');
    } catch (error) {
      console.error('[AdminHome] Failed to upload ambience image:', error);
      showError('Erro ao carregar imagem do ambiente');
    } finally {
      setNewAmbienceUploading(false);
    }
  };

  const handleRemoveAmbience = (id: string) => {
    setAmbiences(ambiences.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await homeService.updateHomeConfig({
        hero_title: heroTitle,
        hero_highlight_word: heroHighlightWord,
        hero_image_url: heroImageUrl,
        ambiences,
        promo_enabled: promoEnabled,
        promo_text: promoText,
        promo_image_url: promoImageUrl,
      });
      showSuccess('Configuração salva com sucesso');
    } catch (error) {
      console.error('[AdminHome] Failed to save config:', error);
      showError('Erro ao salvar configuração');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold">CMS da Home</h1>
          <p className="text-gray-600 text-sm mt-1">
            Personalize a página inicial sem mexer no código
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadConfig} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              Hero Principal
            </CardTitle>
            <CardDescription>
              Personalize o banner principal da home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="hero_title">Título Principal</Label>
              <Input
                id="hero_title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Ex: Porque a sua casa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_highlight_word">Palavra Destacada</Label>
              <Input
                id="hero_highlight_word"
                value={heroHighlightWord}
                onChange={(e) => setHeroHighlightWord(e.target.value)}
                placeholder="Ex: merece o melhor"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem do Hero</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)}
                    disabled={heroUploading}
                  />
                </div>
                <Button
                  onClick={handleHeroImageUpload}
                  disabled={!heroImageFile || heroUploading}
                  variant="outline"
                >
                  {heroUploading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Carregar
                    </>
                  )}
                </Button>
              </div>
              {heroImageUrl && (
                <div className="mt-4">
                  <img
                    src={heroImageUrl}
                    alt="Preview do Hero"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ambientes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              Ambientes
            </CardTitle>
            <CardDescription>
              Configure os ambientes que aparecem na home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Ambience */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-semibold text-sm">Adicionar Ambiente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ambience_title">Título *</Label>
                  <Input
                    id="ambience_title"
                    value={newAmbienceTitle}
                    onChange={(e) => setNewAmbienceTitle(e.target.value)}
                    placeholder="Ex: Sala"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ambience_slug">Slug da Categoria *</Label>
                  <Input
                    id="ambience_slug"
                    value={newAmbienceSlug}
                    onChange={(e) => setNewAmbienceSlug(e.target.value)}
                    placeholder="Ex: sala"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagem *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewAmbienceImageFile(e.target.files?.[0] || null)}
                    disabled={newAmbienceUploading}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAmbience}
                disabled={!newAmbienceTitle || !newAmbienceSlug || !newAmbienceImageFile || newAmbienceUploading}
                className="w-full"
              >
                {newAmbienceUploading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Adicionar Ambiente
                  </>
                )}
              </Button>
            </div>

            {/* Ambiences List */}
            {ambiences.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhum ambiente configurado ainda
              </div>
            ) : (
              <div className="space-y-3">
                {ambiences.map((ambience) => => (
                  <div
                    key={ambience.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-white"
                  >
                    <img
                      src={ambience.image_url}
                      alt={ambience.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{ambience.title}</div>
                      <div className="text-sm text-gray-500">{ambience.category_slug}</div>
                    </div>
                    <Button
                      onClick={() => handleRemoveAmbience(ambience.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promo Banner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">Promoção</Badge>
              Banner Promocional
            </CardTitle>
            <CardDescription>
              Configure o banner promocional que aparece na home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={promoEnabled}
                onCheckedChange={setPromoEnabled}
                id="promo_enabled"
                disabled={saving}
                label="Banner Promocional Ativo"
                className="data-[state=checked]:bg-green-600"
              />
              </div>
            </div>

            {promoEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="promo_text">Texto Promocional</Label>
                  <Textarea
                    id="promo_text"
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    placeholder="Ex: Oferta especial por tempo limitado!"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagem Promocional</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPromoImageFile(e.target.files?.[0] || null)}
                        disabled={promoUploading}
                      />
                    </div>
                    <Button
                      onClick={handlePromoImageUpload}
                      disabled={!promoImageFile || promoUploading}
                      variant="outline"
                    >
                      {promoUploading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Carregar
                        </>
                      )}
                    </Button>
                  </div>
                  {promoImageUrl && (
                    <div className="mt-4">
                      <img
                        src={promoImageUrl}
                        alt="Preview do Banner"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;