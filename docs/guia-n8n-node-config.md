# Guia Rápido - Configurar Nós HTTP no n8n

## Configuração Base do Nó HTTP Request

### 1. Nó HTTP Request - Criar Lead

**Authentication:** None  
**Request Method:** POST  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Body Content Type:** JSON  
**Body:**
```json
{
  "name": "Teste Integração IA",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "Lead criado para validação"
}
```

---

### 2. Nó HTTP Request - Atualizar Status do Lead

**Authentication:** None  
**Request Method:** POST  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_update_lead_status`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Body Content Type:** JSON  
**Body:**
```json
{
  "lead_id": "={{ $json.lead_id }}",
  "status": "talking_human"
}
```

*Nota: Use `{{ $json.lead_id }}` para capturar o ID do nó anterior*

---

### 3. Nó HTTP Request - Adicionar Nota ao Lead

**Authentication:** None  
**Request Method:** POST  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_lead_note`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Body Content Type:** JSON  
**Body:**
```json
{
  "lead_id": "={{ $('Create Lead').item.json.lead.id }}",
  "message": "Nota de teste via n8n"
}
```

*Nota: Use `$('NodeName').item.json.path` para referenciar dados de nós anteriores*

---

### 4. Nó HTTP Request - Buscar Status do Pedido

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=ORDER_ID_AQUI`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

*Ou usando query parameters:*
- Adicione "Query Parameters" no nó
- Key: `order_id`
- Value: `UUID_DO_PEDIDO`

---

### 5. Nó HTTP Request - Buscar Montadores

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_assemblers`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Query Parameters (opcional):**
- `city`: São Paulo
- `limit`: 10

---

### 6. Nó HTTP Request - Buscar Produtos

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Query Parameters (opcional):**
- `q`: solar
- `category`: modulos-solares
- `limit`: 10

---

### 7. Nó HTTP Request - Buscar Produto por ID

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_product_by_id`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Query Parameters:**
- `id`: UUID_DO_PRODUTO

---

## Nó Supabase - Configuração (Para Validação no Banco)

### 1. Criar Conexão Supabase

1. Adicione nó "Supabase"
2. **Authentication:** API Key
3. **Connection:**
   - **API Base URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co`
   - **API Key:** `{SERVICE_ROLE_KEY}`
4. **Test Connection**

*Nota: Use SERVICE_ROLE_KEY para ter acesso total ao banco*

---

### 2. Consultar Leads Após Criação

**Operation:** Select  
**Table:** leads  
**Query:**
```sql
SELECT * FROM leads 
WHERE name = 'Teste Integração IA' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 3. Consultar Timeline Após Adicionar Nota

**Operation:** Select  
**Table:** lead_timeline  
**Query:**
```sql
SELECT * FROM lead_timeline 
WHERE lead_id = 'UUID_DO_LEAD' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Workflow Sugerido no n8n

```
[Start] → [Define Variables] → [Create Lead] → [Update Status] → [Add Note] → [Check Order Status]
           ↓                       ↓                    ↓              ↓                  ↓
        [Token Hash]         [Save Lead ID]      [Timeline Check]   [DB Check Lead]   [DB Check Order]
```

### 1. Nó Define Variables

Adicione um nó "Set" para definir variáveis usadas em todos os nós:

```json
{
  "values": [
    {
      "name": "TOKEN_HASH",
      "value": "SEU_TOKEN_HASH_AQUI",
      "type": "string"
    },
    {
      "name": "ORDER_ID",
      "value": "UUID_DO_PEDIDO_PARA_TESTE",
      "type": "string"
    },
    {
      "name": "PRODUCT_ID",
      "value": "UUID_DO_PRODUTO_PARA_TESTE",
      "type": "string"
    }
  ]
}
```

---

## Exemplos de Workflow Completo

### Workflow 1: Teste Completo de Leads

```
1. Set (Define Variables)
   ↓
2. HTTP Request → POST agent_create_lead
   ↓
3. Set (Save lead_id to variable)
   ↓
4. HTTP Request → POST agent_update_lead_status
   ↓
5. HTTP Request → POST agent_add_lead_note
   ↓
6. Supabase → SELECT * FROM leads WHERE id = lead_id
   ↓
7. If (Check ok: true)
   ├─ True: Set "✅ Teste Passou"
   └─ False: Set "❌ Teste Falhou"
```

---

### Workflow 2: Teste de Erro - Sem Token

```
1. HTTP Request → POST agent_create_lead
   (SEM header x-agent-token)
   ↓
2. If (Check response.ok: false)
   ├─ True: Set "✅ Erro esperado"
   └─ False: Set "❌ Deveria retornar erro"
```

---

## Dicas Úteis

### Expressões no n8n

**Referenciar dados do nó anterior:**
```
{{ $json }}
```

**Acessar campo específico:**
```
{{ $json.ok }}
{{ $json.lead.id }}
```

**Referenciar nó específico por nome:**
```
{{ $('Create Lead').item.json.lead.id }}
```

**Condicional:**
```
{{ $json.ok ? 'Sucesso' : 'Erro' }}
```

---

### Testando Múltiplos Cenários

Use nó "Switch" para testar diferentes cenários:

```
[HTTP Request] → [Switch on ok field]
                   ├─ ok === true → [Log: Sucesso]
                   ├─ ok === false → [Switch on error type]
                   │                 ├─ "Missing token" → [Log: Erro esperado]
                   │                 ├─ "Invalid token" → [Log: Erro esperado]
                   │                 └─ Other → [Log: Erro inesperado]
```

---

### Variáveis de Ambiente no n8n

Em vez de hardcode o token, use variáveis de ambiente:

1. Vá em Settings → Variables
2. Adicione:
   - `SUPABASE_AGENT_TOKEN`: Seu token hash
   - `SUPABASE_SERVICE_KEY`: Service role key
3. Use no workflow:
   ```
   {{ $env.SUPABASE_AGENT_TOKEN }}
   ```

---

## Validação Automática

### Nó IF para Validar Sucesso

**Condition:** `{{ $json.ok === true }}`

**True Branch:** Sucesso
- Nó "Set" com mensagem: `✅ Endpoint funcionou`
- Salvar logs

**False Branch:** Falha
- Nó "Set" com mensagem: `❌ Endpoint falhou: {{ $json.error }}`
- Salvar logs para análise

---

### Nó IF para Validar Campos

**Condition:** `{{ $json.lead.id !== null }}`

**True Branch:** ID gerado com sucesso
- Salvar ID em variável global

**False Branch:** ID não gerado
- Marcar teste como falha

---

## Checklist de Configuração

### Antes de Executar:
- [ ] Token hash configurado corretamente
- [ ] URLs estão completas e corretas
- [ ] Headers incluem `x-agent-token`
- [ ] Body está formatado como JSON válido
- [ ] IDs de teste existem no banco (order_id, product_id)

### Durante Execução:
- [ ] Executar workflow
- [ ] Verificar response de cada nó
- [ ] Conferir logs de erro (se houver)
- [ ] Validar no banco de dados

### Após Executar:
- [ ] Documentar resultados
- [ ] Anotar IDs gerados
- [ ] Comparar com expectativas
- [ ] Registrar issues encontradas

---

## Troubleshooting Comum

### Erro: "Missing x-agent-token header"
- Verifique se o header foi adicionado
- Verifique se o nome do header está exato (case-sensitive)

### Erro: "Invalid or inactive token"
- Confirme que o token está correto
- Verifique no banco se `active = true`
- Confirme que está usando `token_hash`, não o token original

### Erro: "Insufficient permissions"
- Verifique os scopes do token no banco
- Adicione scopes necessários ao token

### Erro: "Lead not found"
- Confirme que o ID existe no banco
- Verifique se o ID foi passado corretamente
- Use o ID retornado pelo endpoint de criação

---

## Referência Rápida de URLs

| Endpoint | Método | URL |
|----------|--------|-----|
| Criar Lead | POST | `/functions/v1/agent_create_lead` |
| Atualizar Status | POST | `/functions/v1/agent_update_lead_status` |
| Adicionar Nota | POST | `/functions/v1/agent_add_lead_note` |
| Status Pedido | GET | `/functions/v1/agent_get_order_status` |
| Montadores | GET | `/functions/v1/agent_get_assemblers` |
| Buscar Produtos | GET | `/functions/v1/agent_products_search` |
| Produto por ID | GET | `/functions/v1/agent_product_by_id` |

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co`
