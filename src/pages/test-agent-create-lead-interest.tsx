import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const TestAgentCreateLeadInterest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'n8n' | 'agent' | 'site-ai'>('n8n');
  const [intent, setIntent] = useState<'catalog_interest' | 'order_help' | 'human_handoff' | 'custom'>('catalog_interest');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead_interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-token': '9f8d7e6a5b4c3d2e1f0a9b8c7d6e5f4', // Token do n8n AI Agent
        },
        body: JSON.stringify({
          customer_name: customerName || undefined,
          customer_phone: customerPhone,
          message,
          source,
          context: {
            product_id: productId || undefined,
            product_name: productName || undefined,
            category_slug: categorySlug || undefined,
            intent,
          },
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (!data.ok) {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const fillTestExample = () => {
    setCustomerName('João Silva');
    setCustomerPhone('11987654321');
    setMessage('Gostaria de saber mais sobre o sofá de três lugares');
    setSource('n8n');
    setIntent('catalog_interest');
    setProductName('Sofá de Três Lugares');
    setCategorySlug('sala');
  };

  const clearForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setMessage('');
    setSource('n8n');
    setIntent('catalog_interest');
    setProductId('');
    setProductName('');
    setCategorySlug('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Testar Edge Function: agent_create_lead_interest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Esta função registra interesse de atendimento vindo da IA no sistema de leads.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nome do Cliente (opcional)</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone do Cliente (obrigatório)</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex: 11987654321"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mensagem do Cliente (obrigatório)</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Gostaria de saber mais sobre o sofá"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="n8n">n8n</option>
                <option value="agent">agent</option>
                <option value="site-ai">site-ai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Intent</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="catalog_interest">catalog_interest</option>
                <option value="order_help">order_help</option>
                <option value="human_handoff">human_handoff</option>
                <option value="custom">custom</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product ID (opcional)</label>
                <Input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="UUID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product Name (opcional)</label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Sofá de Três Lugares"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category Slug (opcional)</label>
                <Input
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="Ex: sala"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={loading || !customerPhone || !message}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </Button>

              <Button
                onClick={fillTestExample}
                variant="outline"
                type="button"
              >
                Preencher Exemplo
              </Button>

              <Button
                onClick={clearForm}
                variant="outline"
                type="button"
              >
                Limpar
              </Button>
            </div>

            {result && (
              <Card className={`mt-4 ${result.ok ? 'border-green-500' : 'border-red-500'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    {result.ok ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="mt-4 border-red-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 mb-1">Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAgentCreateLeadInterest;
