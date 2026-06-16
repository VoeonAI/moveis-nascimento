# Workflow n8n - Agente Comercial via Webhook

Arquivo importavel:

`docs/n8n/workflow-agente-comercial-webhook.json`

Este workflow recebe mensagens por Webhook, normaliza payloads comuns da Evolution API e do Chatwoot, decide a intencao da conversa e chama as Edge Functions do Supabase ja existentes no projeto.

## O que ele faz

- Recebe mensagem via Webhook n8n.
- Extrai mensagem, telefone e nome do cliente.
- Classifica a intencao por regras:
  - busca de produto;
  - detalhe/preco/estoque;
  - interesse de compra;
  - atendimento humano;
  - rastreio de pedido;
  - montadores;
  - fallback.
- Chama os endpoints:
  - `agent_products_search`
  - `agent_product_by_id`
  - `agent_create_lead_interest`
  - `agent_add_lead_note`
  - `agent_update_lead_status`
  - `agent_find_recent_orders_by_phone`
  - `agent_get_order_status`
  - `agent_get_assemblers`
- Retorna um JSON com `reply`, pronto para enviar ao cliente.

## Variaveis no n8n

Configure em `Settings > Variables` ou ajuste diretamente no Code node:

```txt
SUPABASE_FUNCTIONS_URL=https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1
AGENT_TOKEN=seu_token_hash_da_tabela_agent_tokens
PUBLIC_SITE_URL=https://seu-site.com.br
```

O token precisa ter, idealmente:

```txt
products:read
products:read_private
orders:read
leads:write
leads:update
leads:read
```

Se nao quiser expor preco/estoque ao agente, remova `products:read_private`.

## Como importar

1. Abra o n8n.
2. Va em `Workflows`.
3. Clique em `Import from File`.
4. Selecione `workflow-agente-comercial-webhook.json`.
5. Configure as variaveis acima.
6. Ative o workflow.
7. Copie a URL de producao do Webhook.
8. Configure essa URL como destino no fluxo que recebe mensagens da Evolution ou Chatwoot.

## Endpoint do webhook

Path configurado:

```txt
moveis-nascimento-agent
```

O n8n vai gerar uma URL parecida com:

```txt
https://SEU_N8N/webhook/moveis-nascimento-agent
```

## Resposta do workflow

O workflow responde algo assim:

```json
{
  "ok": true,
  "reply": "Encontrei estas opções:\n1. Sofá 3 Lugares - https://...",
  "next_action": "send_reply",
  "intent": "product_search",
  "lead_id": null,
  "customer": {
    "name": "Cliente WhatsApp",
    "phone": "5511999999999"
  }
}
```

Use o campo:

```txt
{{$json.reply}}
```

no seu no de envio de mensagem da Evolution ou Chatwoot.

## Como acoplar Evolution

Se a Evolution chama diretamente esse Webhook, voce tem duas opcoes:

1. Se seu fluxo atual espera resposta sincrona, use o campo `reply` da resposta.
2. Se o envio e separado, adicione depois do Code node um HTTP Request para a Evolution.

Exemplo conceitual de envio Evolution:

```txt
POST {EVOLUTION_URL}/message/sendText/{INSTANCE}
apikey: {EVOLUTION_API_KEY}
Content-Type: application/json
```

Body:

```json
{
  "number": "={{ $json.customer.phone }}",
  "text": "={{ $json.reply }}"
}
```

Confirme o endpoint exato conforme a versao da sua Evolution API.

## Como acoplar Chatwoot

Se quiser responder pelo Chatwoot, adicione um HTTP Request depois do Code node.

Exemplo conceitual:

```txt
POST {CHATWOOT_URL}/api/v1/accounts/{ACCOUNT_ID}/conversations/{CONVERSATION_ID}/messages
api_access_token: {CHATWOOT_TOKEN}
Content-Type: application/json
```

Body:

```json
{
  "content": "={{ $json.reply }}",
  "message_type": "outgoing"
}
```

No payload original do Chatwoot, preserve o `conversation.id` para montar a URL.

## Payloads que o workflow tenta entender

### Evolution comum

```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "pushName": "Joao",
    "message": {
      "conversation": "Tem sofa retratil?"
    }
  }
}
```

### Chatwoot comum

```json
{
  "event": "message_created",
  "content": "Quero rastrear meu pedido",
  "sender": {
    "name": "Joao",
    "phone_number": "+5511999999999"
  },
  "conversation": {
    "id": 123
  }
}
```

## Intencoes reconhecidas

| Intencao | Quando dispara | Acao |
|----------|----------------|------|
| `product_search` | termos de catalogo/produto | Busca produtos |
| `product_detail` | preco, valor, estoque, UUID de produto | Busca detalhe |
| `lead_interest` | interesse, comprar, orcamento | Cria/reusa lead |
| `human_handoff` | humano, atendente, vendedor | Cria/reusa lead e muda para `talking_human` |
| `order_tracking` | pedido, entrega, rastreio, status | Busca pedidos/status |
| `assemblers` | montador, montagem, instalador | Busca montadores |
| `fallback` | mensagem sem intencao clara | Registra contexto e orienta cliente |

## Pontos importantes

- O workflow nao envia mensagem sozinho por Evolution/Chatwoot; ele gera o `reply`.
- Isso evita travar em endpoint/versionamento especifico da Evolution ou Chatwoot.
- Para producao, recomendo adicionar um no de log e um no de tratamento de erro externo.
- A classificacao atual e por regras. Se quiser, da para trocar por um no OpenAI/LLM depois, mantendo os mesmos endpoints.

## Testes rapidos

Envie para o Webhook:

```json
{
  "content": "Tem guarda roupa casal?",
  "sender": {
    "name": "Teste",
    "phone_number": "+5511999999999"
  }
}
```

Outros testes:

```json
{ "content": "Quero falar com um atendente", "sender": { "phone_number": "+5511999999999" } }
```

```json
{ "content": "Quero rastrear meu pedido", "sender": { "phone_number": "+5511999999999" } }
```

```json
{ "content": "Tem montador em Sao Paulo?", "sender": { "phone_number": "+5511999999999" } }
```
