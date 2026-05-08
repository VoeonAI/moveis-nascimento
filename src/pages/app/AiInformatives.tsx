import React, { useEffect, useState } from 'react';
import { 
  aiInformativesService, 
  AiInformative, 
  CreateAiInformativeInput, 
  UpdateAiInformativeInput 
} from '@/services/aiInformativesService';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Button, 
  Card, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  Input, 
  Label, 
  Textarea, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge
} from '@/components/ui';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type StatusType = 'active' | 'scheduled' | 'expired' | 'inactive';

const AiInformatives = () => {
  const [informatives, setInformatives] = useState<AiInformative[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInformatives, setActiveInformatives] = useState<AiInformative[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInformative, setEditingInformative] = useState<AiInformative | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notice',
    starts_at: '',
    ends_at: '',
    active: true,
  });

  const loadInformatives = async () => {
    setLoading(true);
    try {
      const [all, active] = await Promise.all([
        aiInformativesService.listAll(),
        aiInformativesService.listActive(),
      ]);
      setInformatives(all);
      setActiveInformatives(active);
    } catch (error) {
      console.error('[AiInformatives] Error loading:', error);
      showError('Erro ao carregar informativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInformatives();
  }, []);

  const handleOpenDialog = (informative: AiInformative | null = null) => {
    if (informative) {
      setEditingInformative(informative);
      setFormData({
        title: informative.title || '',
        content: informative.content,
        type: informative.type,
        starts_at: informative.starts_at ? informative.starts_at.slice(0, 16) : '',
        ends_at: informative.ends_at ? informative.ends_at.slice(0, 16) : '',
        active: informative.active,
      });
    } else {
      setEditingInformative(null);
      setFormData({
        title: '',
        content: '',
        type: 'notice',
        starts_at: '',
        ends_at: '',
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInformative(null);
    setFormData({
      title: '',
      content: '',
      type: 'notice',
      starts_at: '',
      ends_at: '',
      active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const input: CreateAiInformativeInput = {
        title: formData.title || undefined,
        content: formData.content,
        type: formData.type,
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at || undefined,
        active: formData.active,
      };

      if (editingInformative) {
        await aiInformativesService.update(editingInformative.id, input as UpdateAiInformativeInput);
        showSuccess('Informativo atualizado com sucesso');
      } else {
        await aiInformativesService.create(input);
        showSuccess('Informativo criado com sucesso');
      }

      handleCloseDialog();
      loadInformatives();
    } catch (error) {
      console.error('[AiInformatives] Error saving:', error);
      showError('Erro ao salvar informativo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este informativo?')) return;

    try {
      await aiInformativesService.delete(id);
      showSuccess('Informativo excluído com sucesso');
      loadInformatives();
    } catch (error) {
      console.error('[AiInformatives] Error deleting:', error);
      showError('Erro ao excluir informativo');
    }
  };

  const getStatusBadge = (informative: AiInformative) => {
    const status = aiInformativesService.getStatus(informative);
    
    const badges: Record<StatusType, { icon: React.ElementType; label: string; className: string }> = {
      active: {
        icon: CheckCircle2,
        label: 'Ativo',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      scheduled: {
        icon: Clock,
        label: 'Programado',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      expired: {
        icon: XCircle,
        label: 'Expirado',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      },
      inactive: {
        icon: XCircle,
        label: 'Inativo',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
    };

    const { icon: Icon, label, className } = badges[status];

    return (
      <Badge variant="outline" className={className}>
        <Icon size={14} className="mr-1" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Informativos IA</h1>
          <p className="text-gray-600 mt-1">Gerencie informativos para contexto do agente de IA</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus size={18} className="mr-2" />
          Novo Informativo
        </Button>
      </div>

      {/* Active Informatives Banner */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-white border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {activeInformatives.length > 0
                ? `${activeInformatives.length} informativo${activeInformatives.length > 1 ? 's' : ''} ativo${activeInformatives.length > 1 ? 's' : ''} no momento`
                : 'Nenhum informativo ativo no momento'
              }
            </h2>
            {activeInformatives.length > 0 ? (
              <div className="space-y-2">
                {activeInformatives.slice(0, 3).map((info) => (
                  <div key={info.id} className="bg-white rounded-lg p-3 border border-blue-100">
                    {info.title && <p className="font-medium text-gray-900 mb-1">{info.title}</p>}
                    <p className="text-sm text-gray-600 line-clamp-2">{info.content}</p>
                  </div>
                ))}
                {activeInformatives.length > 3 && (
                  <p className="text-sm text-blue-600 font-medium">
                    +{activeInformatives.length - 3} informativo{activeInformatives.length - 3 > 1 ? 's' : ''} adicional{activeInformatives.length - 3 > 1 ? 'ais' : ''}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Crie novos informativos para fornecer contexto ao agente de IA.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : informatives.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum informativo cadastrado</h3>
            <p className="text-gray-600 mb-4">Crie o primeiro informativo para começar.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus size={18} className="mr-2" />
              Criar Informativo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {informatives.map((informative) => (
            <Card key={informative.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(informative)}
                      {informative.type && (
                        <Badge variant="secondary" className="text-xs">
                          {informative.type}
                        </Badge>
                      )}
                    </div>
                    {informative.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {informative.title}
                      </h3>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {informative.content}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(informative)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(informative.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t">
                  {informative.starts_at && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Início: {formatDate(informative.starts_at)}</span>
                    </div>
                  )}
                  {informative.ends_at && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Término: {formatDate(informative.ends_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>Criado: {formatDate(informative.created_at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInformative ? 'Editar Informativo' : 'Novo Informativo'}
            </DialogTitle>
            <DialogDescription>
              {editingInformative
                ? 'Edite as informações do informativo.'
                : 'Preencha as informações para criar um novo informativo.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título curto para o informativo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">Aviso</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="policy">Política</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo do informativo que será usado pelo agente de IA"
                rows={6}
                required
              />
              <p className="text-xs text-gray-500">
                Este conteúdo será usado como contexto pelo agente de IA.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Data de início (opcional)</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Se preenchido, o informativo só será aplicável a partir desta data.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at">Data de término (opcional)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Se preenchido, o informativo deixará de ser aplicável após esta data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Informativo ativo
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : editingInformative ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiInformatives;