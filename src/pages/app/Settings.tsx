import React, { useEffect, useState } from "react";
import { useAuth } from "@/core/auth/AuthProvider";
import { Role } from "@/constants/domain";
import { PermissionGate } from "@/core/guards/PermissionGate";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import { RefreshCw, Globe, Phone, Code, Clock, Copy, Save, Loader2, Key, Plus, AlertCircle } from "lucide-react";

import {
  webhooksManagementService,
  WebhookEndpoint,
  WebhookLog,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENTS,
} from "@/services/webhooksManagementService";
import { settingsService } from "@/services/settingsService";
import { agentTokensService, AgentToken } from "@/services/agentTokensService";
import { showError, showSuccess } from "@/utils/toast";

export default function Settings() {
  const { profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  const [loading, setLoading] = useState(true);

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [agentTokens, setAgentTokens] = useState<AgentToken[]>([]);

  const [storeWhatsApp, setStoreWhatsApp] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  // Webhook creation state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    url: '',
    active: true,
    events: [] as string[],
  });
  const [creatingEndpoint, setCreatingEndpoint] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const projectRef = useMemo(() => {
    return supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "<project-ref>";
  }, [supabaseUrl]);

  const functionsBaseUrl = "https://" + projectRef + ".supabase.co/functions/v1";
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
      const [eps, lgs, wa, tokens] = await Promise.all([
        webhooksManagementService.listEndpoints(),
        isMaster ? webhooksManagementService.listLogs(100) : Promise.resolve([]),
        isMaster ? settingsService.getStoreWhatsApp() : Promise.resolve(null),
        isMaster ? agentTokensService.listTokens() : Promise.resolve([]),
      ]);
      setEndpoints(eps);
      setLogs(lgs);
      setAgentTokens(tokens);
      setStoreWhatsApp(wa ?? "");
      setWhatsappSaved(Boolean(wa));
    } catch (e) {
      console.error("[Settings] loadData error", e);
      showError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
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
      console.error("[Settings] save WhatsApp error", e);
      setWhatsappSaved(false);
      showError(e?.message || "Erro ao salvar WhatsApp");
    } finally {
      setSavingWhatsApp(false);
    }
  }

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.name.trim()) {
      showError("Nome é obrigatório");
      return;
    }
    
    if (!createFormData.url.trim()) {
      showError("URL é obrigatória");
      return;
    }
    
    if (createFormData.events.length === 0) {
      showError("Selecione pelo menos um evento");
      return;
    }
    
    setCreatingEndpoint(true);
    try {
      await webhooksManagementService.createEndpoint({
        name: createFormData.name,
        url: createFormData.url,
        active: createFormData.active,
        events: createFormData.events,
        secret: undefined,
      });
      
      showSuccess("Endpoint criado com sucesso");
      setCreateModalOpen(false);
      setCreateFormData({
        name: '',
        url: '',
        active: true,
        events: [],
      });
      await loadData();
    } catch (error: any) {
      console.error("[Settings] create endpoint error", error);
      showError(error.message || "Erro ao criar endpoint");
    } finally {
      setCreatingEndpoint(false);
    }
  };

  const toggleEvent = (eventKey: string) => {
    setCreateFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventKey)
        ? prev.events.filter(e => e !== eventKey)
        : [...prev.events, eventKey],
    }));
  };

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
                  <Button onClick={() => setCreateModalOpen(true)}>
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{ep.name}</div>
                            <Badge variant={ep.active ? "default" : "secondary"}>{ep.active ? "Ativo" : "Inativo"}</Badge>
                          </div>
                          <div className="text-xs text-gray-600 font-mono break-all mt-1">{ep.url}</div>
                        </div>
                        <PermissionGate allowedRoles={[Role.MASTER]}>
                          <div className="text-xs text-gray-500">Edição avançada permanece na versão anterior.</div>
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
                </CardHeader>
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
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(activeToken.token_hash)}>
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

      {/* Create Webhook Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Endpoint de Webhook</DialogTitle>
            <DialogDescription>
              Configure um novo endpoint para receber notificações de eventos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEndpoint} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_name">Nome *</Label>
              <Input
                id="webhook_name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                placeholder="Ex: Integração n8n"
                disabled={creatingEndpoint}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL *</Label>
              <Input
                id="webhook_url"
                value={createFormData.url}
                onChange={(e) => setCreateFormData({ ...createFormData, url: e.target.value })}
                placeholder="https://seu-endpoint.com/webhook"
                disabled={creatingEndpoint}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="webhook_active"
                checked={createFormData.active}
                onCheckedChange={(checked) => setCreateFormData({ ...createFormData, active: checked as boolean })}
                disabled={creatingEndpoint}
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
                      checked={createFormData.events.includes(value)}
                      onCheckedChange={() => toggleEvent(value)}
                      disabled={creatingEndpoint}
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
                onClick={() => setCreateModalOpen(false)}
                disabled={creatingEndpoint}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingEndpoint}>
                {creatingEndpoint ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Endpoint'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}