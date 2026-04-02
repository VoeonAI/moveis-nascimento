# Guia n8n - Rastreio de Pedidos

## Configuração Rápida dos Nós

---

## 1. Nó HTTP Request - Buscar Pedidos por Telefone

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Query Parameters:**
- Key: `phone`
- Value: `{{ $json.TEST_PHONE }}`

**Exemplo de URL completa:**
```
https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone={{ $json.TEST_PHONE }}
```

---

## 2. Nó HTTP Request - Buscar Status do Pedido

**Authentication:** None  
**Request Method:** GET  
**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status`

**Headers:**
```
Content-Type: application/json
x-agent-token: {{ $json.TOKEN_HASH }}
```

**Query Parameters:**
- Key: `order_id`
- Value: `{{ $('Find Orders').item.json.orders[0].order_id }}`

**Exemplo de URL completa:**
```
https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id={{ $('Find Orders').item.json.orders[0].order_id }}
```

---

## Workflow Completo de Validação

```
[Start]
   ↓
[Set Variables]
   ↓
[Find Orders by Phone] → [Check if orders exist]
                           ↓
                    [Orders?]
                   /        \
              [Yes]        [No]
                ↓            ↓
         [Get Order Status]  [Log: No orders found]
                ↓
         [Validate Response]
                ↓
         [Log: Success]
```

---

## Detalhe dos Nós

### Nó 1: Set Variables

**Tipo:** Set  
**Purpose:** Definir variáveis usadas no workflow

```json
{
  "values": [
    {
      "name": "TOKEN_HASH",
      "value": "seu_token_hash_aqui",
      "type": "string"
    },
    {
      "name": "TEST_PHONE",
      "value": "5511999999999",
      "type": "string"
    }
  ]
}
```

---

### Nó 2: Find Orders by Phone

**Tipo:** HTTP Request  
**Purpose:** Buscar pedidos recentes por telefone

**Configuração:**
- **Method:** GET
- **URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone`

**Query Parameters:**
| Key | Value |
|-----|-------|
| phone | `{{ $json.TEST_PHONE }}` |

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| x-agent-token | `{{ $json.TOKEN_HASH }}` |

**Teste de Normalização de Telefone:**

Crie um nó **Set** com múltiplos formatos de telefone:

```json
{
  "values": [
    {
      "name": "TEST_PHONES",
      "value": [
        "5511999999999",
        "11999999999",
        "(11) 99999-9999",
        "+55 11 99999-9999"
      ]
    }
  ]
}
```

Use um nó **Split in Batches** para testar cada formato.

---

### Nó 3: Check if orders exist

**Tipo:** IF  
**Purpose:** Verificar se encontrou pedidos

**Condition:**
```
{{ $json.orders.length > 0 }}
```

**True Branch:** Ir para nó "Get Order Status"  
**False Branch:** Ir para nó "Log: No orders found"

---

### Nó 4: Get Order Status

**Tipo:** HTTP Request  
**Purpose:** Buscar status do primeiro pedido

**Configuração:**
- **Method:** GET
- **URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status`

**Query Parameters:**
| Key | Value |
|-----|-------|
| order_id | `{{ $('Find Orders by Phone').item.json.orders[0].order_id }}` |

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| x-agent-token | `{{ $json.TOKEN_HASH }}` |

---

### Nó 5: Validate Response

**Tipo:** IF  
**Purpose:** Validar se resposta é correta

**Condition:**
```
{{ $json.ok === true }}
```

**True Branch:** Ir para nó "Log: Success"  
**False Branch:** Ir para nó "Log: Error"

---

### Nó 6: Log Results

**Tipo:** Set  
**Purpose:** Registrar resultados

**Exemplo para Sucesso:**
```json
{
  "values": [
    {
      "name": "result",
      "value": "✅ Teste Passou",
      "type": "string"
    },
    {
      "name": "order_count",
      "value": "{{ $('Find Orders by Phone').item.json.count }}",
      "type": "number"
    },
    {
      "name": "order_status",
      "value": "{{ $('Get Order Status').item.json.order.label }}",
      "type": "string"
    }
  ]
}
```

---

## Testes de Erro

### Teste 1: Sem Token

**Crie um nó HTTP Request** sem o header `x-agent-token`

**Expected:**
```json
{
  "ok": false,
  "error": "Missing x-agent-token header"
}
```

---

### Teste 2: Token Inválido

**Crie um nó HTTP Request** com token inválido

**Headers:**
```
x-agent-token: token_invalido_teste_12345
```

**Expected:**
```
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

---

### Teste 3: Sem Permissão

**Crie um token no banco sem scope `orders:read`**

```sql
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES ('Token Sem Permissao', 'hash_sem_permissao', ARRAY['products:read'], true);
```

**Use este token no request**

**Expected:**
```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

---

### Teste 4: Parâmetro Faltando - Phone

**Crie um nó HTTP Request** sem query parameter `phone`

**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone`

**Expected:**
```json
{
  "ok": false,
  "error": "Missing required parameter: phone"
}
```

---

### Teste 5: Parâmetro Faltando - Order ID

**Crie um nó HTTP Request** sem query parameter `order_id`

**URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status`

**Expected:**
```json
{
  "ok": false,
  "error": "Missing required parameter: order_id"
}
```

---

### Teste 6: Order ID Inexistente

**Crie um nó HTTP Request** com order_id inválido

**URL:**
```
https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=00000000-0000-0000-0000-000000000000
```

**Expected:**
```json
{
  "ok": false,
  "error": "Order not found"
}
```

---

## Teste de Normalização de Telefone

### Workflow de Múltiplos Formatos

```
[Set Multiple Phones]
   ↓
[Split in Batches]
   ↓
[For Each Phone]
   ↓
[Find Orders by Phone]
   ↓
[Check Results]
   ↓
[Assert Same Orders]
```

### Nó Set Multiple Phones

```json
{
  "values": [
    {
      "name": "phone_formats",
      "value": [
        {
          "format": "E.164",
          "phone": "5511999999999"
        },
        {
          "format": "Sem código país",
          "phone": "11999999999"
        },
        {
          "format": "Formatado",
          "phone": "(11) 99999-9999"
        },
        {
          "format": "Com + e espaços",
          "phone": "+55 11 99999-9999"
        }
      ]
    }
  ]
}
```

### Nó For Each Phone

Use nó **Item Lists** → **Split Out Items** para iterar sobre cada formato.

### Validação

Todos os formatos devem retornar **o mesmo número de pedidos** e **os mesmos order_ids**.

---

## Validação com Banco de Dados

### Nó Supabase - Check Orders

Adicione um nó **Supabase** para validar no banco:

**Authentication:** API Key  
**Connection:**
- **API Base URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co`
- **API Key:** `{SERVICE_ROLE_KEY}`

**Operation:** Execute SQL  
**Query:**
```sql
SELECT 
  id,
  customer_phone,
  current_stage,
  internal_code,
  created_at,
  updated_at
FROM orders
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;
```

### Nó Compare Results

Use nó **Code** para comparar resultados:

```javascript
const apiOrders = $input.all()[0].json.orders;
const dbOrders = $input.all()[1].json;

// Compare counts
return [{
  json: {
    api_count: apiOrders.length,
    db_count: dbOrders.length,
    match: apiOrders.length === dbOrders.length,
    api_orders: apiOrders.map(o => o.order_id),
    db_orders: dbOrders.map(o => o.id)
  }
}];
```

---

## Dicas Úteis

### Expressões Comuns

**Acessar o primeiro pedido:**
```
{{ $json.orders[0] }}
```

**Acessar order_id do primeiro pedido:**
```
{{ $json.orders[0].order_id }}
```

**Acessar label do status:**
```
{{ $json.order.label }}
```

**Contar pedidos:**
```
{{ $json.orders.length }}
```

---

### Variáveis de Ambiente

Em vez de hardcode o token, use variáveis de ambiente:

1. Vá em Settings → Variables
2. Adicione:
   - `SUPABASE_AGENT_TOKEN`: Seu token hash
   - `TEST_PHONE`: Telefone de teste

3. Use no workflow:
   ```
   {{ $env.SUPABASE_AGENT_TOKEN }}
   {{ $env.TEST_PHONE }}
   ```

---

### Debug

Para debugar, adicione nós **Set** para capturar informações:

```json
{
  "values": [
    {
      "name": "debug_api_response",
      "value": "{{ JSON.stringify($json) }}",
      "type": "string"
    }
  ]
}
```

---

## Checklist de Configuração

### Antes de Executar:
- [ ] Token com scope `orders:read` criado
- [ ] Token hash obtido
- [ ] Pedidos de teste no banco (com customer_phone)
- [ ] Pedidos criados nos últimos 90 dias
- [ ] URLs completas e corretas
- [ ] Headers incluem `x-agent-token`
- [ ] Query params configurados

### Durante Execução:
- [ ] Executar workflow
- [ ] Verificar response de cada nó
- [ ] Conferir logs de erro (se houver)
- [ ] Validar que ok: true em sucesso
- [ ] Validar mensagem de erro em falha

### Após Executar:
- [ ] Comparar com banco de dados
- [ ] Documentar resultados
- [ ] Anotar IDs encontrados
- [ ] Registrar issues (se houver)

---

## Resumo de URLs

| Endpoint | Método | URL |
|----------|--------|-----|
| Buscar Pedidos por Telefone | GET | `/functions/v1/agent_find_recent_orders_by_phone` |
| Buscar Status do Pedido | GET | `/functions/v1/agent_get_order_status` |

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co`

**Scope Necessário:** `orders:read`

---

## Troubleshooting

### Erro: "Missing x-agent-token header"
- Verifique se o header foi adicionado
- Verifique se o nome está exato (case-sensitive)

### Erro: "Invalid or inactive token"
- Confirme que o token está correto
- Verifique no banco se `active = true`
- Confirme que está usando `token_hash`

### Erro: "Insufficient permissions"
- Verifique se o token tem scope `orders:read`
- Adicione o scope ao token se necessário

### Erro: "Missing required parameter"
- Verifique se os query params foram adicionados
- Verifique se os nomes estão corretos (phone, order_id)

### Pedidos não retornam
- Verifique se o telefone existe no banco
- Verifique se o pedido foi criado nos últimos 90 dias
- Verifique se o formato do telefone está correto

---

## Teste Final Completo

Execute este workflow completo e valide todos os passos:

1. ✅ Set Variables
2. ✅ Find Orders by Phone (deve retornar pedidos)
3. ✅ Check if orders exist (deve ser TRUE)
4. ✅ Get Order Status (deve retornar status)
5. ✅ Validate Response (deve ser TRUE)
6. ✅ Compare with Database (deve dar MATCH)

Se todos passarem, os endpoints estão funcionando corretamente! 🎉
