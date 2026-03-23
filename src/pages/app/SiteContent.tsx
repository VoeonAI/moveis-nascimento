import React, { useEffect, useState, useRef } from 'react';
import { homeHeroService, HomeHero } from '@/services/homeHeroService';
import { homeAmbiencesService, HomeAmbience } from '@/services/homeAmbiencesService';
import { homeAssetsService } from '@/services/homeAssetsService';
import { Loader2, Image as ImageIcon, AlertCircle, Save, Upload, CheckCircle, XCircle, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';

const SiteContent = () => {
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [ambiences, setAmbiences] = useState<HomeAmbience[]>([]);
  const [loading, setLoading] = useState(true);
  const [ambiencesLoading, setAmbiencesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hero Form state
  const [formData, setFormData] = useState({
    title: '',
    highlight_word: '',
    image_url: '',
    image_alt: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambiences Edit state
  const [editingAmbienceId, setEditingAmbienceId] = useState<string | null>(null);
  const [editingFormData, setEditingFormData] = useState<Partial<HomeAmbience>>({});
  const [savingAmbienceId, setSavingAmbienceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setAmbiencesLoading(true);
    setError(null);
    try {
      const [heroData, ambiencesData] = await Promise.all([
        homeHeroService.getHomeHero(),
        homeAmbiencesService.listAllAmbiences(),
      ]);
      setHero(heroData);
      setAmbiences(ambiencesData);
      
      // Populate Hero Form
      if (heroData) {
        setFormData({
          title: heroData.title || '',
          highlight_word: heroData.highlight_word || '',
          image_url: heroData.image_url || '',
          image_alt: heroData.image_alt || '',
        });
      }
    } catch (err) {
      console.error('[SiteContent] Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
      setHero(null);
      setAmbiences([]);
    } finally {
      setLoading(false);
      setAmbiencesLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await homeAssetsService.uploadHeroImage(file);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      showSuccess('Imagem enviada com sucesso');
    } catch (err) {
      console.error('[SiteContent] Erro no upload:', err);
      showError('Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await homeHeroService.upsertHomeHero({
        title: formData.title,
        highlight_word: formData.highlight_word,
        image_url: formData.image_url,
        image_alt: formData.image_alt,
        active: true,
      });
      showSuccess('Banner atualizado com sucesso');
      await loadData();
    } catch (err) {
      console.error('[SiteContent] Erro ao salvar hero:', err);
      showError('Erro ao salvar banner');
    } finally {
      setSaving(false);
    }
  };

  // Ambiences Handlers
  const handleStartEdit = (ambience: HomeAmbience) => {
    setEditingAmbienceId(ambience.id);
    setEditingFormData({
      title: ambience.title,
      category_slug: ambience.category_slug,
      image_url: ambience.image_url,
      active: ambience.active,
      sort_order: ambience.sort_order,
    });
  };

  const handleCancelEdit = () => {
    setEditingAmbienceId(null);
    setEditingFormData({});
  };

  const handleSaveAmbience = async (id: string) => {
    setSavingAmbienceId(id);
    try {
      await homeAmbiencesService.updateAmbience(id, editingFormData);
      showSuccess('Ambiente atualizado com sucesso');
      await loadData();
      handleCancelEdit();
    } catch (err) {
      console.error('[SiteContent] Erro ao salvar ambiente:', err);
      showError('Erro ao salvar ambiente');
    } finally {
      setSavingAmbienceId(null);
    }
  };

  const handleAmbienceToggleActive = async (ambience: HomeAmbience) => {
    try {
      await homeAmbiencesService.updateAmbience(ambience.id, {
        active: !ambience.active,
      });
      showSuccess(ambience.active ? 'Ambiente desativado' : 'Ambiente ativado');
      await loadData();
    } catch (error: any) {
      console.error('[SiteContent] toggle ambience active error', error);
      showError(error.message || 'Erro ao atualizar ambiente');
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
      showSuccess('Ordem atualizada');
      await loadData();
    } catch (error: any) {
      console.error('[SiteContent] move ambience error', error);
      showError(error.message || 'Erro ao atualizar ordem');
    }
  };

  // Função para renderizar o título com highlight
  const renderTitle = () => {
    if (!hero) return '';
    
    const title = hero.title || '';
    const highlight = hero.highlight_word || '';

    if (!highlight || !title.includes(highlight)) {
      return title;
    }

    const parts = title.split(highlight);

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="text-green-400 font-bold">{highlight}</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Conteúdo do Site</h1>
      <p className="text-gray-600 text-sm mb-6">
        Gerencie o banner principal e os ambientes da página inicial.
      </p>

      {/* Hero Section - Preview */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Preview do Banner Principal</h2>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Carregando preview...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle size={20} />
              <div>
                <p className="font-medium">Erro ao carregar Hero</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        ) : !hero ? (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum banner configurado</h3>
            <p className="text-gray-500 text-sm">
              Configure um banner na aba "Banner Principal" para ver o preview aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Hero Preview - Mesma altura que na home (600px md:700px) */}
            <div className="relative h-[600px] md:h-[700px] overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: hero.image_url ? `url('${hero.image_url}')` : 'none' }}>
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
              </div>

              {/* Conteúdo sobreposto */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-center">
                <div className="max-w-2xl space-y-6">
                  {/* Título com highlight */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    {renderTitle()}
                  </h1>

                  {/* Subtítulo fixo */}
                  <p className="text-lg md:text-xl text-gray-200">
                    Atendimento personalizado com o Nas e suporte do nosso time de consultores.
                  </p>

                  {/* Botões (visuais apenas, sem funcionalidade) */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all inline-flex items-center gap-2">
                      Ver Catálogo
                    </div>
                    <div className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all inline-flex items-center gap-2">
                      Nossa História
                    </div>
                  </div>

                  {/* Badges de confiança */}
                  <div className="flex items-center gap-6 pt-8">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-2xl">📞</span>
                      <span className="font-medium">Atendimento Personalizado</span>
                    </div>
                    <div className="w-px h-8 bg-white/30"></div>
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                      <span className="font-medium">Qualidade Garantida</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info dos dados */}
            <div className="p-6 bg-gray-50 border-t space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Título</p>
                <p className="text-sm font-medium text-gray-900">{hero.title || '<sem título>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Palavra de Destaque</p>
                <p className="text-sm font-medium text-gray-900">{hero.highlight_word || '<sem highlight>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">URL da Imagem</p>
                <p className="text-xs text-gray-600 font-mono break-all">{hero.image_url || '<sem URL>'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Texto Alternativo</p>
                <p className="text-sm font-medium text-gray-900">{hero.image_alt || '<sem alt>'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Edit Form */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-12">
        <h2 className="text-lg font-semibold mb-4">Editar Texto do Banner</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero_title">Título Principal</Label>
            <Input
              id="hero_title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Porque a sua casa merece o melhor."
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_highlight">Palavra de Destaque</Label>
            <Input
              id="hero_highlight"
              value={formData.highlight_word}
              onChange={(e) => setFormData({ ...formData, highlight_word: e.target.value })}
              placeholder="Ex: merece o melhor."
              disabled={saving}
            />
            <p className="text-xs text-gray-500">
              Esta palavra será destacada em verde dentro do título.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_alt">Texto Alternativo (Alt)</Label>
            <Input
              id="hero_alt"
              value={formData.image_alt}
              onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
              placeholder="Descrição da imagem para acessibilidade"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
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
        </div>
      </div>

      {/* Hero Image Upload */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-12">
        <h2 className="text-lg font-semibold mb-4">Imagem do Banner</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            
            {/* Upload Button */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="flex-1"
              >
                {uploading ? (
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
              disabled={uploading || saving}
            />
            
            <p className="text-xs text-gray-500">
              Formatos aceitos: JPG, PNG, WebP. Proporção recomendada: 2.7:1 (1920x700px).
            </p>
          </div>

          {/* URL da Imagem (editável) */}
          <div className="space-y-2">
            <Label htmlFor="hero_image_url">URL da Imagem</Label>
            <Input
              id="hero_image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
              disabled={saving}
            />
            <p className="text-xs text-gray-500">
              Você pode colar uma URL manualmente ou usar o upload acima.
            </p>
            
            {/* Preview da Imagem */}
            {formData.image_url && (
              <div className="mt-2 border rounded-md overflow-hidden bg-gray-50">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
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
        </div>
      </div>

      {/* Ambientes Section - Editable */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Ambientes da Home</h2>
        
        {ambiencesLoading ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Carregando ambientes...</p>
          </div>
        ) : ambiences.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum ambiente cadastrado</h3>
            <p className="text-gray-500 text-sm">
              Configure ambientes na aba "Ambientes" para ver a lista aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ambiences.map((ambience) => {
              const isEditing = editingAmbienceId === ambience.id;
              const isSaving = savingAmbienceId === ambience.id;

              return (
                <div key={ambience.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                  {/* Imagem (Sempre visível) */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {ambience.image_url ? (
                      <img
                        src={ambience.image_url}
                        alt={ambience.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {ambience.active ? (
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <CheckCircle size={12} />
                          Ativo
                        </div>
                      ) : (
                        <div className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <XCircle size={12} />
                          Inativo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    {/* Display Mode */}
                    {!isEditing ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{ambience.title}</h3>
                          <span className="text-xs text-gray-500">#{ambience.sort_order}</span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                          Categoria: <span className="font-medium text-gray-900">{ambience.category_slug}</span>
                        </p>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAmbienceToggleActive(ambience)}
                            title={ambience.active ? "Desativar" : "Ativar"}
                          >
                            {ambience.active ? "Desativar" : "Ativar"}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveAmbience(ambience, 'up')}
                            disabled={ambience.sort_order === 0}
                            title="Mover para cima"
                          >
                            <ArrowUp size={14} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveAmbience(ambience, 'down')}
                            disabled={ambience.sort_order === Math.max(...ambiences.map(a => a.sort_order))}
                            title="Mover para baixo"
                          >
                            <ArrowDown size={14} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(ambience)}
                          >
                            <Edit size={14} className="mr-1" />
                            Editar
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`ambience_title_${ambience.id}`}>Título</Label>
                          <Input
                            id={`ambience_title_${ambience.id}`}
                            value={editingFormData.title || ''}
                            onChange={(e) => setEditingFormData({ ...editingFormData, title: e.target.value })}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ambience_category_${ambience.id}`}>Slug da Categoria</Label>
                          <Input
                            id={`ambience_category_${ambience.id}`}
                            value={editingFormData.category_slug || ''}
                            onChange={(e) => setEditingFormData({ ...editingFormData, category_slug: e.target.value })}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ambience_order_${ambience.id}`}>Ordem de Exibição</Label>
                          <Input
                            id={`ambience_order_${ambience.id}`}
                            type="number"
                            min="0"
                            max="99"
                            value={editingFormData.sort_order ?? 0}
                            onChange={(e) => setEditingFormData({ ...editingFormData, sort_order: parseInt(e.target.value) || 0 })}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`ambience_active_${ambience.id}`}
                            checked={editingFormData.active ?? false}
                            onCheckedChange={(checked) => setEditingFormData({ ...editingFormData, active: checked })}
                            disabled={isSaving}
                          />
                          <Label htmlFor={`ambience_active_${ambience.id}`} className="cursor-pointer">
                            Ambiente Ativo
                          </Label>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleSaveAmbience(ambience.id)}
                            disabled={isSaving}
                            size="sm"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save size={14} className="mr-1" />
                                Salvar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteContent;