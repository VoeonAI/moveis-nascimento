import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';

const HomeHeroAdmin = () => {
  const [heroTitle, setHeroTitle] = useState('');
  const [heroHighlight, setHeroHighlight] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    loadHero();
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
      console.error('[HomeHeroAdmin] Failed to load hero:', error);
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
      console.error('[HomeHeroAdmin] Failed to save hero:', error);
      showError('Erro ao salvar banner');
    } finally {
      setSavingHero(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Banner Principal</h1>
        <p className="text-gray-600">Personalize o banner da página inicial.</p>
      </div>

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
            <Label htmlFor="hero_image_file">Enviar imagem do banner</Label>
            <Input
              id="hero_image_file"
              type="file"
              accept="image/*"
              disabled={savingHero}
            />
            <p className="text-xs text-gray-500">
              Recomendado: imagem horizontal 1920x700
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
    </div>
  );
};

export default HomeHeroAdmin;