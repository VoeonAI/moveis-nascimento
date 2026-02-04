import React, { useEffect, useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { PermissionGate } from '@/core/guards/PermissionGate';
import { Role } from '@/constants/domain';
import { webhooksManagementService, WebhookEndpoint, WebhookLog, WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from '@/services/webhooksManagementService';
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
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Globe,
  Clock,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  // Webhooks state
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  // Filters
  const [filterEndpointId, setFilterEndpointId] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [endpointsData, logsData] = await Promise.all([
        webhooksManagementService.listEndpoints(),
        isMaster ? webhooksManagementService.listLogs(50) : Promise.resolve([]),
      ]);
      setEndpoints(endpointsData);
      setLogs(logsData);
    } catch (error) {
      console.error('[Settings] Failed to load data', error);
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEndpoint(null);
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      secret: endpoint.secret || '',
      active: endpoint.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) {
      return;
    }

    try {
      await webhooksManagementService.deleteEndpoint(id);
      showSuccess('Webhook excluído');
      await loadData();
    } catch (error) {
      console.error('[Settings] Failed to delete endpoint', error);
      showError('Erro ao excluir webhook');
    }
  };

  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestingEndpoint(endpoint.id);
    try {
      const result = await webhooksManagementService.testEndpoint(endpoint);
      
      if (result.success) {
        showSuccess(`Webhook testado com sucesso (${result.statusCode})`);
      } else {
        showError(`Falha no teste (${result.statusCode}): ${result.error || 'Erro desconhecido'}`);
      }
      
      // Reload logs to show the test
      await loadData();
    } catch (error) {
      console.error('[Settings] Failed to test endpoint', error);
      showError('Erro ao testar webhook');
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      showError('Nome e URL são obrigatórios');
      return;
    }

    if (formData.events.length === 0) {
      showError('Selecione pelo menos um evento');
      return;
    }

    try {
      if (editingEndpoint) {
        await webhooksManagementService.updateEndpoint(editingEndpoint.id, formData);
        showSuccess('Webhook atualizado');
      } else {
        await webhooksManagementService.createEndpoint(formData);
        showSuccess('Webhook criado');
      }
      
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('[Settings] Failed to save endpoint', error);
      showError('Erro ao salvar webhook');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const clearFilters = () => {
    setFilterEndpointId('all');
    setFilterEventType('all');
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (filterEndpointId !== 'all' && log.endpoint_id !== filterEndpointId) {
        return false;
      }
      if (filterEventType !== 'all' && log.event_type !== filterEventType) {
        return false;
      }
      return true;
    });
  };

  const getLogStatusIcon = (log: WebhookLog) => {
    if (log.success) {
      return <CheckCircle size={16} className="text-green-600" />;
    }
    return <XCircle size={16} className="text-red-600" />;
  };

  const getPayloadSummary = (payload: any) => {
    try {
      const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return str.length > 100 ? str.slice(0, 100) + '...' : str;
    } catch {
      return 'Payload inválido';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie webhooks e integrações do sistema
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks">
            <Globe size={16} className="mr-2" />
            Webhooks
          </TabsTrigger>
          {isMaster && (
            <TabsTrigger value="logs">
              <Clock size={16} className="mr-2" />
              Logs
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure endpoints para receber notificações de eventos
                  </CardDescription>
                </div>
                <PermissionGate allowedRoles={[Role.MASTER]}>
                  <Button onClick={handleCreate}>
                    <Plus size={16} className="mr-2" />
                    Novo Webhook
                  </Button>
                </PermissionGate>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando...
                </div>
              ) : endpoints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum webhook configurado</p>
                  <p className="text-sm">
                    Configure webhooks para receber notificações de eventos do sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {endpoints.map((endpoint) => (
                    <div key={endpoint.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{endpoint.name}</h3>
                            <Badge variant={endpoint.active ? 'default' : 'secondary'}>
                              {endpoint.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono break-all">
                            {endpoint.url}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleTest(endpoint)}
                            disabled={testingEndpoint === endpoint.id}
                            variant="outline"
                            size="sm"
                          >
                            <TestTube size={14} className="mr-1" />
                            {testingEndpoint === endpoint.id ? 'Testando...' : 'Testar'}
                          </Button>
                          <PermissionGate allowedRoles={[Role.MASTER]}>
                            <Button
                              onClick={() => handleEdit(endpoint)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              onClick={() => handleDelete(endpoint.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {endpoint.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {WEBHOOK_EVENT_LABELS[event as keyof typeof WEBHOOK_EVENT_LABELS] || event}
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
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Logs de Webhooks</CardTitle>
                    <CardDescription>
                      Histórico de envios de webhooks
                    </CardDescription>
                  </div>
                  {(filterEndpointId !== 'all' || filterEventType !== 'all') && (
                    <Button onClick={clearFilters} variant="ghost" size="sm">
                      <X size={14} className="mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter size={14} />
                      <label className="text-sm font-medium">Endpoint</label>
                    </div>
                    <Select value={filterEndpointId} onValueChange={setFilterEndpointId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os endpoints</SelectItem>
                        {endpoints.map(ep => (
                          <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter size={14} />
                      <label className="text-sm font-medium">Tipo de Evento</label>
                    </div>
                    <Select value={filterEventType} onValueChange={setFilterEventType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os eventos</SelectItem>
                        {Object.entries(WEBHOOK_EVENT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Carregando...
                  </div>
                ) : getFilteredLogs().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum log encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredLogs().map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getLogStatusIcon(log)}
                            <div>
                              <div className="font-medium">
                                {WEBHOOK_EVENT_LABELS[log.event_type as keyof typeof WEBHOOK_EVENT_LABELS] || log.event_type}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.status_code}
                          </Badge>
                        </div>
                        
                        {(log as any).webhook_endpoints && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Endpoint:</span> {(log as any).webhook_endpoints.name}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
                          {getPayloadSummary(log.payload)}
                        </div>
                        
                        {!log.success && log.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {log.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingEndpoint ? 'Editar Webhook' : 'Novo Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber notificações de eventos
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Integração WhatsApp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://seu-sistema.com/webhook"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="space-y-2">
                {Object.entries(WEBHOOK_EVENT_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <Switch
                      id={`event-${value}`}
                      checked={formData.events.includes(value)}
                      onCheckedChange={() => toggleEvent(value)}
                    />
                    <Label htmlFor={`event-${value}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret (opcional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Chave secreta para validação"
              />
              <p className="text-xs text-gray-500">
                Será enviado no header X-Webhook-Secret
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Webhook ativo
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingEndpoint ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;