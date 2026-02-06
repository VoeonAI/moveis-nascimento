import React, { useEffect, useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { PermissionGate } from '@/core/guards/PermissionGate';
import { Role } from '@/constants/domain';
import { webhooksManagementService, WebhookEndpoint, WebhookLog, WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from '@/services/webhooksManagementService';
import { settingsService } from '@/services/settingsService';
import { agentTokensService, AgentToken } from '@/services/agentTokensService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Edit, Trash2, TestTube, CheckCircle, XCircle, RefreshCw, Globe, Clock, ChevronRight, ChevronDown, Filter, X, Phone, Save, Loader2, Copy, Api, Key, FileText } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [storeWhatsApp, setStoreWhatsApp] = useState('');
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [agentTokens, setAgentTokens] = useState<AgentToken[]>([]);
  const [filterEndpointId, setFilterEndpointId] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [endpointsData, logsData, whatsapp, tokensData] = await Promise.all([
        webhooksManagementService.listEndpoints(),
        isMaster ? webhooksManagementService.listLogs(100) : Promise.resolve([]),
        isMaster ? settingsService.getStoreWhatsApp() : Promise.resolve(null),
        isMaster ? agentTokensService.listTokens() : Promise.resolve([]),
      ]);
      setEndpoints(endpointsData);
      setLogs(logsData);
      setStoreWhatsApp(whatsapp ?? '');
      setWhatsappSaved(!!whatsapp);
      setAgentTokens(tokensData);
    } catch (error) {
      console.error('[Settings] Failed to load data', error);
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEndpoint(null);
    setFormData({ name: '', url: '', events: [], secret: '', active: true });
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
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;
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
      const result = await webhooksManagementService.testEndpoint(endpoint.id);
      if (result.error) {
        showError(result.error);
      } else {
        const firstResult = result.data?.results?.[0];
        const success = firstResult?.success ?? true;
        const statusCode = firstResult?.status_code ?? 'sem status';
        showSuccess(`Teste: ${success ? 'OK' : 'Falhou'} (${statusCode})`);
      }
      await loadData();
    } catch (error: any) {
      console.error('[Settings] Failed to test endpoint', error);
      showError(error.message || 'Erro ao testar webhook');
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

  const handleSaveWhatsApp = async () => {
    if (storeWhatsApp && !/^\d{10,15}$/.test(storeWhatsApp)) {
      showError('Formato inválido. Use apenas números (10-15 dígitos). Ex: 5511999999999');
      return;
    }
    setSavingWhatsApp(true);
    try {
      await settingsService.setStoreWhatsApp(storeWhatsApp);
      setWhatsappSaved(true);
      showSuccess('WhatsApp atualizado com sucesso');
    } catch (error: any) {
      console.error('[Settings] Failed to save WhatsApp', error);
      setWhatsappSaved(false);
      showError(error.message || 'Erro ao salvar WhatsApp');
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }));
  };

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setFilterEndpointId('all');
    setFilterEventType('all');
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (filterEndpointId !== 'all' && log.endpoint_id !== filterEndpointId) return false;
      if (filterEventType !== 'all' && log.event_type !== filterEventType) return false;
      return true;
    });
  };

  const getLogStatusIcon = (log: WebhookLog) => {
    return log.success ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />;
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado para a área de transferência');
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '<project-ref>';
  const functionsBaseUrl = `https://${projectRef}.supabase.co/functions/v1`;

  const curlCategoryExample = `curl -X GET "${functionsBaseUrl}/agent_products_search?category=guarda-roupa&limit=10" -H "Authorization: Bearer <AGENT_TOKEN>"`;
  const curlTextExample = `curl -X GET "${functionsBaseUrl}/agent_products_search?q=guarda%20roupa&limit=10" -H "Authorization: Bearer <AGENT_TOKEN>"`;
  const curlIdExample = `curl -X GET "${functionsBaseUrl}/agent_product_by_id?id=uuid-do-produto" -H "Authorization: Bearer <AGENT_TOKEN>"`;
  const n8nExample = JSON.stringify({
    method: 'GET',
    url: `${functionsBaseUrl}/agent_products_search`,
    queryParameters: { category: 'guarda-roupa', limit: 10 },
    headers: { Authorization: 'Bearer {{$env.AGENT_TOKEN}}' },
  }, null, 2);
  const envelopeExample = JSON.stringify({
    version: '1.0',
    event_type: 'lead.created',
    event_id: 'uuid',
    occurred_at: '2024-01-01T00:00:00Z',
    source: { app: 'moveis-nascimento', env: 'production', channel: 'site' },
    data: {},
    meta: {},
  }, null, 2);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie webhooks, integrações e APIs do sistema</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks"><Globe size={16} className="mr-2" />Webhooks</TabsTrigger>
          {isMaster && <TabsTrigger value="whatsapp"><Phone size={16} className="mr-2" />WhatsApp</TabsTrigger>}
          {isMaster && <TabsTrigger value="apis"><Api size={16} className="mr-2" />APIs</TabsTrigger>}
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
                  <Button onClick={handleCreate}><Plus size={16} className="mr-2" />Novo Webhook</Button>
                </PermissionGate>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : endpoints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum webhook configurado</p>
                  <p className="text-sm">Configure webhooks para receber notificações de eventos do sistema</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {endpoints.map((endpoint) => (
                    <div key={endpoint.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{endpoint.name}</h3>
                            <Badge variant={endpoint.active ? 'default' : 'secondary'}>{endpoint.active ? 'Ativo' : 'Inativo'}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono break-all">{endpoint.url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleTest(endpoint)} disabled={testingEndpoint === endpoint.id} variant="outline" size="sm">
                            <TestTube size={14} className="mr-1" />{testingEndpoint === endpoint.id ? 'Testando...' : 'Testar'}
                          </Button>
                          <PermissionGate allowedRoles={[Role.MASTER]}>
                            <Button onClick={() => handleEdit(endpoint)} variant="ghost" size="sm"><Edit size={14} /></Button>
                            <Button onClick={() => handleDelete(endpoint.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700"><Trash2 size={14} /></Button>
                          </PermissionGate>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">{WEBHOOK_EVENT_LABELS[event as keyof typeof WEBHOOK_EVENT_LABELS] || event}</Badge>
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
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp da Loja</CardTitle>
                <CardDescription>Configure o número WhatsApp para receber mensagens de interesse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store_whatsapp">Número WhatsApp (E.164)</Label>
                  <Input id="store_whatsapp" value={storeWhatsApp} onChange={(e) => { setStoreWhatsApp(e.target.value.replace(/\D/g, '')); setWhatsappSaved(false); }} placeholder="5511999999999" maxLength={15} disabled={savingWhatsApp} />
                  <p className="text-sm text-gray-500">Ex: 5511999999999 (somente números, com DDI + DDD)</p>
                </div>
                <Button onClick={handleSaveWhatsApp} disabled={savingWhatsApp}>
                  {savingWhatsApp ? <><Loader2 size={16} className="mr-2 animate-spin" />Salvando...</> : <><Save size={16} className="mr-2" />Salvar</>}
                </Button>
                {whatsappSaved && storeWhatsApp && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800"><CheckCircle size={20} /><span className="font-medium">Configurado</span></div>
                    <p className="text-sm text-green-700 mt-1">O número <span className="font-mono">{storeWhatsApp}</span> será usado para redirecionar mensagens de interesse.</p>
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
                  <div className="flex items-center gap-2"><Api size={20} /><CardTitle>Agent Catalog API</CardTitle></div>
                  <CardDescription>API para o agente buscar produtos do catálogo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Base URL</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm flex items-center justify-between">
                      <code>{functionsBaseUrl}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(functionsBaseUrl)}><Copy size={14} /></Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Substitua <project-ref> pelo seu ID do projeto Supabase</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Autenticação</Label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                      <p className="font-medium">Headers:</p>
                      <div className="space-y-1 font-mono text-xs">
                        <div>Authorization: Bearer <AGENT_TOKEN></div>
                        <div>Content-Type: application/json</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Key size={16} /><Label className="text-sm font-medium">Tokens do Agente</Label></div>
                    {agentTokens.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <p className="font-medium mb-1">Nenhum token configurado</p>
                        <p className="text-xs">Tokens do agente devem ser criados diretamente no banco de dados (tabela agent_tokens). Certifique-se de incluir o escopo products:read.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {agentTokens.map((token) => (
                          <div key={token.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{token.name}</span>
                              <Badge variant={token.active ? 'default' : 'secondary'}>{token.active ? 'Ativo' : 'Inativo'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Criado em {new Date(token.created_at).toLocaleDateString()}</span>
                              {token.last_used_at && <span>Último uso: {new Date(token.last_used_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Endpoints Disponíveis</Label>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Buscar Produtos</h4>
                          <Badge variant="outline">GET</Badge>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs">Endpoint</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-xs flex items-center justify-between">
                            <code>/agent_products_search</code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('/agent_products_search')}><Copy size={12} /></Button>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs">Query Parameters</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div><code>q</code> (opcional) - Termo de busca (name/description)</div>
                            <div><code>category</code> (opcional) - Slug da categoria</div>
                            <div><code>limit</code> (opcional, padrão 10, máximo 50) - Quantidade de resultados</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs">Exemplo cURL (busca por categoria)</Label>
                          <div className="mt-1 p-2 bg-gray-900 rounded text-xs text-green-400 font-mono relative group">
                            <pre>{curlCategoryExample}</pre>
                            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(curlCategoryExample)}><Copy size={12} /></Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Exemplo cURL (busca por texto)</Label>
                          <div className="mt-1 p-2 bg-gray-900 rounded text-xs text-green-400 font-mono relative group">
                            <pre>{curlTextExample}</pre>
                            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(curlTextExample)}><Copy size={12} /></Button>
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Produto por ID</h4>
                          <Badge variant="outline">GET</Badge>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs">Endpoint</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-xs flex items-center justify-between">
                            <code>/agent_product_by_id</code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('/agent_product_by_id')}><Copy size={12} /></Button>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs">Query Parameters</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs"><div><code>id</code> (obrigatório) - ID do produto</div></div>
                        </div>
                        <div>
                          <Label className="text-xs">Exemplo cURL</Label>
                          <div className="mt-1 p-2 bg-gray-900 rounded text-xs text-green-400 font-mono relative group">
                            <pre>{curlIdExample}</pre>
                            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(curlIdExample)}><Copy size={12} /></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><FileText size={16} /><Label className="text-sm font-medium">Exemplo n8n (HTTP Request Node)</Label></div>
                    <div className="p-3 bg-gray-900 rounded text-xs text-green-400 font-mono relative group overflow-x-auto">
                      <pre>{n8nExample}</pre>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(n8nExample)}><Copy size={12} /></Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">No n8n, use {{$env.AGENT_TOKEN}} para referenciar a variável de ambiente do token.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Globe size={20} /><CardTitle>Webhooks</CardTitle></div>
                  <CardDescription>Como o sistema dispara eventos para o n8n</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Como funciona</Label>
                    <p className="text-sm text-gray-600">O sistema envia eventos para os webhooks configurados. Configure um webhook no n8n com a URL de produção e use o evento para rotear o workflow.</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Payload Envelope v1</Label>
                    <div className="p-3 bg-gray-900 rounded text-xs text-green-400 font-mono relative group overflow-x-auto">
                      <pre>{envelopeExample}</pre>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(envelopeExample)}><Copy size={12} /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Roteamento no n8n</Label>
                    <p className="text-sm text-gray-600 mb-2">Use o event_type para rotear workflows diferentes:</p>
                    <div className="p-3 bg-gray-50 rounded text-xs space-y-1">
                      <div><code>lead.created</code> - Novo lead criado</div>
                      <div><code>opportunity.created</code> - Nova oportunidade criada</div>
                      <div><code>opportunity.stage_changed</code> - Estágio da oportunidade alterado</div>
                      <div><code>order.created</code> - Pedido criado</div>
                      <div><code>order.stage_changed</code> - Estágio do pedido alterado</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {isMaster && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Logs de Webhooks</CardTitle>
                    <CardDescription>Histórico de envios de webhooks</CardDescription>
                  </div>
                  {(filterEndpointId !== 'all' || filterEventType !== 'all') && (
                    <Button onClick={clearFilters} variant="ghost" size="sm"><X size={14} className="mr-1" />Limpar filtros</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><Filter size={14} /><label className="text-sm font-medium">Endpoint</label></div>
                    <Select value={filterEndpointId} onValueChange={setFilterEndpointId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os endpoints</SelectItem>
                        {endpoints.map((ep) => <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><Filter size={14} /><label className="text-sm font-medium">Tipo de Evento</label></div>
                    <Select value={filterEventType} onValueChange={setFilterEventType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os eventos</SelectItem>
                        {Object.entries(WEBHOOK_EVENT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : getFilteredLogs().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Nenhum log encontrado</div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredLogs().map((log) => (
                      <Collapsible key={log.id} open={expandedLogIds.has(log.id)} onOpenChange={() => toggleLogExpanded(log.id)}>
                        <div className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getLogStatusIcon(log)}
                              <div>
                                <div className="font-medium">{WEBHOOK_EVENT_LABELS[log.event_type as keyof typeof WEBHOOK_EVENT_LABELS] || log.event_type}</div>
                                <div className="text-xs text-gray-500">{format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={log.success ? 'default' : 'destructive'}>{log.status_code ?? 'Erro'}</Badge>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">{expandedLogIds.has(log.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="space-y-3 pt-2 border-t">
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Payload</div>
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{formatJson(log.payload)}</pre>
                              </div>
                              {!log.success && log.error && (
                                <div>
                                  <div className="text-xs font-medium text-red-500 mb-1">Error</div>
                                  <div className="text-xs bg-red-50 p-2 rounded text-red-600">{log.error}</div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
            <DialogDescription>Configure um endpoint para receber notificações de eventos</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Integração WhatsApp" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input id="url" type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://seu-sistema.com/webhook" required />
            </div>
            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="space-y-2">
                {Object.entries(WEBHOOK_EVENT_LABELS).filter(([key]) => key !== WEBHOOK_EVENTS.WEBHOOK_TEST).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <Switch id={`event-${value}`} checked={formData.events.includes(value)} onCheckedChange={() => toggleEvent(value)} />
                    <Label htmlFor={`event-${value}`} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Secret (opcional)</Label>
              <Input id="secret" type="password" value={formData.secret} onChange={(e) => setFormData({ ...formData, secret: e.target.value })} placeholder="Chave secreta para validação" />
              <p className="text-xs text-gray-500">Será enviado no header X-Webhook-Secret</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              <Label htmlFor="active" className="cursor-pointer">Webhook ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingEndpoint ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;