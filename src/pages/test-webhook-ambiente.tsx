import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { webhooksService, WEBHOOK_EVENTS } from '@/services/webhooksService';

const TestWebhookAmbiente = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAmbienceWebhook = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('[TestWebhookAmbiente] ==========================================');
      console.log('[TestWebhookAmbiente] Iniciando teste do webhook de ambiente...');
      console.log('[TestWebhookAmbiente] event_type:', WEBHOOK_EVENTS.HOME_AMBIENCE_CLICK);
      console.log('[TestWebhookAmbiente] channel: site');
      console.log('[TestWebhookAmbiente] ==========================================');

      await webhooksService.emit(
        WEBHOOK_EVENTS.HOME_AMBIENCE_CLICK,
        {
          type: 'modulado_interest',
          ambience: 'Sala (Teste Isolado)',
          message: 'Oi, tenho interesse em modulados para Sala.',
        },
        'site',
        {
          page: 'test-webhook-ambiente',
          section: 'isolated-test',
          ambience_id: 'test-isolated-123',
        }
      );

      console.log('[TestWebhookAmbiente] ✅ Webhook enviado com sucesso!');
      console.log('[TestWebhookAmbiente] ==========================================');

      setResult('Webhook enviado com sucesso! Verifique os logs em webhook_logs e se o n8n recebeu o evento.');
    } catch (err) {
      console.error('[TestWebhookAmbiente] ❌ Erro ao enviar webhook:', err);
      console.error('[TestWebhookAmbiente] ==========================================');
      setError(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Teste Isolado: Webhook de Ambiente</CardTitle>
            <CardDescription>
              Teste isolado do evento home_ambience_click fora do fluxo da Home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Este teste vai enviar:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• event_type: <code className="bg-blue-100 px-1 rounded">home_ambience_click</code></li>
                <li>• channel: <code className="bg-blue-100 px-1 rounded">site</code></li>
                <li>• ambience: <code className="bg-blue-100 px-1 rounded">Sala (Teste Isolado)</code></li>
                <li>• message: <code className="bg-blue-100 px-1 rounded">Oi, tenho interesse em modulados para Sala.</code></li>
              </ul>
            </div>

            <Button
              onClick={testAmbienceWebhook}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Enviando...' : 'Testar Webhook de Ambiente'}
            </Button>

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{result}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">Erro:</p>
                <pre className="text-xs text-red-700 overflow-auto">{error}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Como verificar se funcionou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Verifique o console do navegador para logs detalhados</li>
              <li>Verifique a tabela <code className="bg-gray-100 px-1 rounded">webhook_logs</code> no banco</li>
              <li>Verifique se o n8n recebeu o evento <code className="bg-gray-100 px-1 rounded">home_ambience_click</code></li>
              <li>No n8n, o payload deve ter: <code className="bg-gray-100 px-1 rounded">type: "modulado_interest"</code>, <code className="bg-gray-100 px-1 rounded">ambience: "Sala (Teste Isolado)"</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestWebhookAmbiente;
