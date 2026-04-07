# Edge Function: agent_create_lead_interest

## Descrição
Esta Edge Function registra interesse de atendimento vindo da IA (n8n) no sistema de leads.

## Autenticação
- **Header obrigatório:** `x-agent-token`
- **Token:** Use o token do agente "n8n AI Agent" com scopes `leads:write`

## Endpoint
```
POST https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead_interest
```

## Headers
```
Content-Type: application/json
x-agent-token: 9f8d7e6a5b4c3d2e1f0a9b8c7d6e5f4
```

## Request Body

```json
{
  "customer_name": "string (opcional)",
  "customer_phone": "string (obrigatório)",
  "message": "string (obrigatório)",
  "source": "n8n | agent | site-ai",
  "context": {
    "product_id": "uuid (opcional)",
    "product_name": "string (opcional)",
    "category_slug": "string (opcional)",
    "intent": "catalog_interest | order_help | human_handoff | custom"
  }
}
```

## Exemplo de Request

```bash
curl -X POST \
  https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead_interest \
  -H 'Content-Type: application/json' \
  -H 'x-agent-token: 9f8d7e6a5b4c3d2e1f0a9b8c7d6e5f4' \
  -d '{
    "customer_name": "João Silva",
    "customer_phone": "11987654321",
    "message": "Gostaria de saber mais sobre o sofá de três lugares",
    "source": "n8n",
    "context": {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_name": "Sofá de Três Lugares",
      "category_slug": "sala",
      "intent": "catalog_interest"
    }
  }'
```

## Response

### Sucesso (Lead criado)
```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead_id": "123e4567-e89b-12d3-a456-426614174000",
  "created": true,
  "timeline_created": true,
  "lead": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "phone": "11987654321",
    "channel": "ai_assistant",
    "status": "new_interest"
  }
}
```

### Sucesso (Lead existente)
```json
{
  "ok": true,
  "message": "Lead found and updated",
  "lead_id": "123e4567-e89b-12d3-a456-426614174000",
  "created": false,
  "timeline_created": true,
  "lead": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "phone": "11987654321",
    "channel": "site",
    "status": "new_interest"
  }
}
```

### Erro de validação
```json
{
  "ok": false,
  "error": "Missing required field: customer_phone"
}
```

### Erro de autenticação
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

## Comportamento

### Normalização de Telefone
- Todos os caracteres não numéricos são removidos
- `+55 11 98765-4321` → `5511987654321`
- `(11) 98765-4321` → `11987654321`

### Upsert Lógico por Telefone
1. **Se não existir lead:** Cria novo lead com status `new_interest`
2. **Se existir lead:** Reutiliza o lead existente e atualiza `last_activity_at`
3. Se o nome do lead atual é genérico `(sem nome)` e um novo nome é fornecido, atualiza o nome

### Criação de Timeline
- Sempre cria um registro em `lead_timeline` com:
  - `type`: `note`
  - `message`: Formato: `"{nome} expressou interesse via {source}: {message}"`
  - `meta`: Inclui contexto completo (source, intent, product_id, product_name, category_slug, agent_id, agent_name)
  - `created_by`: `null` (system-generated)

### Channel
- Se `source === 'n8n'`: `channel = 'ai_assistant'`
- Caso contrário: `channel = 'site'`

## Teste Local

Acesse `/test-agent-create-lead-interest` para testar a função com uma interface web.

## Logs

A função gera logs detalhados:
- `[agent_create_lead_interest] Request received:` - Dados da requisição
- `[agent_create_lead_interest] Normalized phone:` - Telefone normalizado
- `[agent_create_lead_interest] Lead not found, will create new` ou `Found existing lead:`
- `[agent_create_lead_interest] New lead created:` ou `Reusing existing lead:`
- `[agent_create_lead_interest] Lead updated:`
- `[agent_create_lead_interest] Timeline message:`
- `[agent_create_lead_interest] Timeline entry created successfully`
- `[agent_create_lead_interest] Response:` - Resposta final

## Escopos Necessários
- `leads:write` - Para criar/atualizar leads
