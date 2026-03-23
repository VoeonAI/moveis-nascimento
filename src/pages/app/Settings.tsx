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
  Loader2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  Image as ImageIcon,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { homeAssetsService } from '@/services/homeAssetsService'; // NOVO IMPORT

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

  // NOVO: Estado para upload
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  // ... (restante do código permanece igual)

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

  // NOVO: Handler para upload de imagem do Hero
  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

    // Validação simples
    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setSelectedHeroFile(file);
    setUploadingHero(true);
    setHeroImageError(false);

    try {
      // Chama o helper de upload
      const url = await homeAssetsService.uploadHeroImage(file);
      
      // Atualiza o campo de URL com o resultado
      setHeroImageUrl(url);
      
      // Opcional: preencher o campo Alt com o nome do arquivo
      if (!heroImageAlt) {
        setHeroImageAlt(file.name);
      }
      
      showSuccess('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('[Settings] Failed to upload hero image:', error);
      setHeroImageError(true);
      showError('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingHero(false);
      setSelectedHeroFile(null); // Limpa seleção
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      e.target.value = '';
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

  // ... (restante do código permanece igual)

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
                    disabled={savingHero || uploadingHero}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_highlight">Palavra de Destaque</Label>
                  <Input
                    id="hero_highlight"
                    value={heroHighlight}
                    onChange={(e) => setHeroHighlight(e.target.value)}
                    disabled={savingHero || uploadingHero}
                  />
                  <p className="text-xs text-gray-500">
                    Esta palavra será destacada em verde dentro do título.
                  </p>
                </div>

                {/* Upload de Imagem - ATUALIZADO */}
                <div className="space-y-2">
                  <Label htmlFor="hero_image_file">Enviar imagem do banner</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hero_image_file"
                      type="file"
                      accept="image/*"
                      disabled={savingHero || uploadingHero}
                      onChange={handleHeroFileChange}
                      className="flex-1"
                    />
                    {uploadingHero && (
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Recomendado: imagem horizontal 1920x700
                  </p>
                  
                  {/* Feedback do arquivo selecionado */}
                  {selectedHeroFile && !uploadingHero && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      <CheckCircle2 size={16} />
                      <span>Arquivo pronto: {selectedHeroFile.name}</span>
                    </div>
                  )}
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
                    disabled={savingHero || uploadingHero}
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
                    disabled={savingHero || uploadingHero}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveHero} disabled={savingHero || uploadingHero}>
                    {savingHero ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : uploadingHero ? (
                      <>
                        <Upload size={16} className="mr-2" />
                        Enviando...
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

        {/* ... (restante do código permanece igual) */}
      </Tabs>
    </div>
  );
};

export default Settings;