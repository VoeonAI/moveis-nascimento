# Validação - Rastreio de Pedidos IA

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Autenticação:** Header `x-agent-token` com o token hash do agente

**Scope Necessário:** `orders:read`

---

## ENDPOINT 1: Buscar Pedidos Recentes por Telefone

**Método:** `GET`
**URL:** `{BASE_URL}agent_find_recent_orders_by_phone?phone={PHONE}`

### Headers
```
Content-Type: application/json
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `phone` (string, obrigatório): Telefone do cliente em qualquer formato

### Exemplos de Telefone
- `5511999999999` - formato E.164 completo
- `11999999999` - formato brasileiro sem código país
- `(11) 99999-9999` - formato brasileiro formatado
- `11 99999 9999` - formato brasileiro com espaços

**Todos os formatos serão normalizados para E.164 automaticamente.**

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "uuid-do-pedido-1",
      "product_name": "Em Montagem",
      "created_at": "2024-01-15T10:30:00.000Z",
      "order_stage": "assembly",
      "updated_at": "2024-01-16T14:20:00.000Z"
    },
    {
      "order_id": "uuid-do-pedido-2",
      "product_name": "Pronto para Envio",
      "created_at": "2024-01-10T09:00:00.000Z",
      "order_stage": "ready_to_ship",
      "updated_at": "2024-01-12T16:45:00.000Z"
    }
  ],
  "count": 2
}
```

### Resposta Esperada (Vazio)
```json
{
  "ok": true,
  "orders": [],
  "count": 0
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Missing required parameter: phone"
}
```

### Regras de Busca
- ✅ Apenas pedidos dos **últimos 90 dias**
- ✅ Ordenados do **mais recente para o mais antigo**
- ✅ Limite de 50 resultados
- ✅ Telefone normalizado automaticamente para formato E.164

### Tabelas a Conferir no Banco (Após Teste)
```sql
-- Buscar pedidos pelo telefone normalizado
SELECT 
  id,
  customer_phone,
  current_stage,
  created_at,
  updated_at
FROM orders
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC
LIMIT 50;
```

### Checklist de Validação n8n
- [ ] Token com scope `orders:read`
- [ ] Enviar request GET com telefone em qualquer formato
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `orders` é um array
- [ ] Validar que os pedidos são dos últimos 90 dias
- [ ] Validar que estão ordenados por `created_at` DESC
- [ ] Validar normalização de telefone (usar diferentes formatos)
- [ ] Conferir no banco se os resultados conferem

### Testes de Normalização de Telefone
Teste com estes formatos - todos devem retornar o mesmo resultado:
- [ ] `5511999999999` (E.164)
- [ ] `11999999999` (sem código país)
- [ ] `(11) 99999-9999` (formatado)
- [ ] `+55 11 99999-9999` (com + e espaços)

---

## ENDPOINT 2: Buscar Status do Pedido

**Método:** `GET`
**URL:** `{BASE_URL}agent_get_order_status?order_id={ORDER_ID}`

### Headers
```
Content-Type: application/json
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `order_id` (UUID, obrigatório): ID do pedido

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "order": {
    "order_id": "uuid-do-pedido",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "2024-01-16T14:20:00.000Z",
    "product_name": "PED-2024-001"
  }
}
```

### Campos Retornados
- `order_id`: UUID do pedido
- `status`: Status técnico (código interno)
- `label`: Label amigável em português
- `updated_at`: Data/hora da última atualização
- `product_name`: Código interno do pedido (field `internal_code`)

### Status Técnicos e Labels
| Status Técnico | Label Amigável |
|----------------|----------------|
| `order_created` | Pedido Criado |
| `preparing_order` | Preparando Pedido |
| `assembly` | Em Montagem |
| `ready_to_ship` | Pronto para Envio |
| `delivery_route` | Em Rota de Entrega |
| `delivered` | Entregue |
| `canceled` | Cancelado |

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Order not found"
}
```

### Tabelas a Conferir no Banco (Após Teste)
```sql
-- Buscar pedido pelo ID
SELECT 
  id,
  current_stage,
  updated_at,
  internal_code
FROM orders
WHERE id = 'uuid-do-pedido';
```

### Checklist de Validação n8n
- [ ] Token com scope `orders:read`
- [ ] Usar `order_id` obtido no Endpoint 1
- [ ] Enviar request GET com `order_id` na query string
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `order.order_id` está correto
- [ ] Validar que `order.status` corresponde ao `current_stage` no banco
- [ ] Validar que `order.label` está em português e é amigável
- [ ] Validar que `order.updated_at` confere com o banco
- [ ] Conferir no banco se os dados conferem

---

## TESTES DE ERRO

### Testes Comuns de Erro

#### 1. Sem Token
**Endpoint 1 e 2:** Remover header `x-agent-token`

**Esperado:**
```json
{
  "ok": false,
  "error": "Missing x-agent-token header"
}
```

#### 2. Token Inválido
**Endpoint 1 e 2:** Usar token inválido como `token_invalido_teste`

**Esperado:**
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

#### 3. Sem Permissão
**Endpoint 1 e 2:** Usar token sem scope `orders:read`

**Esperado:**
```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

#### 4. Parâmetros Faltando

**Endpoint 1:** Não enviar parâmetro `phone`
```json
{
  "ok": false,
  "error": "Missing required parameter: phone"
}
```

**Endpoint 2:** Não enviar parâmetro `order_id`
```json
{
  "ok": false,
  "error": "Missing required parameter: order_id"
}
```

#### 5. Pedido Não Encontrado
**Endpoint 2:** Usar ID que não existe como `00000000-0000-0000-0000-000000000000`

**Esperado:**
```json
{
  "ok": false,
  "error": "Order not found"
}
```

---

## FLUXO DE TESTE COMPLETO SUGERIDO (n8n)

### Setup Inicial
```sql
-- Criar token de teste com scope orders:read
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token Teste Rastreio',
  'seu_token_hash_aqui',
  ARRAY['orders:read'],
  true
)
RETURNING id, name, token_hash, scopes;
```

```sql
-- Criar pedidos de teste (se necessário)
INSERT INTO orders (customer_phone, current_stage, internal_code, customer_name)
VALUES 
  ('5511999999999', 'assembly', 'PED-TESTE-001', 'Cliente Teste 1'),
  ('5511999999999', 'ready_to_ship', 'PED-TESTE-002', 'Cliente Teste 1'),
  ('5511888888888', 'delivery_route', 'PED-TESTE-003', 'Cliente Teste 2')
RETURNING id, created_at;
```

### Sequência de Testes

#### Teste 1: Buscar pedidos por telefone
1. **Endpoint 1**: `GET agent_find_recent_orders_by_phone?phone=5511999999999`
2. Validar resposta
3. Anotar `order_id` do primeiro pedido para próximo teste

#### Teste 2: Buscar status de pedido específico
1. **Endpoint 2**: `GET agent_get_order_status?order_id={order_id_anterior}`
2. Validar resposta
3. Conferir no banco

#### Teste 3: Testar normalização de telefone
Repetir Teste 1 com diferentes formatos:
- `11999999999`
- `(11) 99999-9999`
- `+55 11 99999-9999`

Todos devem retornar os mesmos pedidos.

#### Teste 4: Testar telefone sem pedidos
1. **Endpoint 1**: `GET agent_find_recent_orders_by_phone?phone=5511777777777`
2. Validar que retorna `orders: []` e `count: 0`

#### Teste 5: Testes de erro
- [ ] Sem token (ambos endpoints)
- [ ] Token inválido (ambos endpoints)
- [ ] Token sem scope `orders:read` (ambos endpoints)
- [ ] Parâmetros faltando (ambos endpoints)
- [ ] Order ID inexistente (Endpoint 2)

---

## VALIDAÇÃO DE BANCO

### Após Teste 1 (Buscar pedidos por telefone)
```sql
-- Verificar pedidos encontrados
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

-- Deve retornar o mesmo número de registros que o endpoint
```

### Após Teste 2 (Buscar status)
```sql
-- Verificar dados do pedido
SELECT 
  id,
  current_stage,
  updated_at,
  internal_code,
  created_at
FROM orders
WHERE id = 'uuid-do-pedido';

-- Comparar com a resposta do endpoint
```

### Verificar normalização de telefone
```sql
-- Todos os formatos devem gerar o mesmo normalized phone
-- Teste manual:
SELECT 
  '5511999999999' as telefone,
  REGEXP_REPLACE('5511999999999', '[^0-9]', '', 'g') as limpo;
```

---

## WORKFLOW n8n EXEMPLO

```
[Set Variables]
   ↓
[GET agent_find_recent_orders_by_phone]
   ↓
[IF orders count > 0]
   ├─ True → [Set: Save first order_id]
   │          ↓
   │       [GET agent_get_order_status]
   │          ↓
   │       [Set: Validate response]
   │
   └─ False → [Set: No orders found]
```

### Nó Set Variables
```json
{
  "values": [
    {
      "name": "TOKEN_HASH",
      "value": "seu_token_hash_aqui"
    },
    {
      "name": "TEST_PHONE",
      "value": "5511999999999"
    }
  ]
}
```

### Nó HTTP Request - Buscar Pedidos
- **Method:** GET
- **URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone={{ $json.TEST_PHONE }}`
- **Headers:** `x-agent-token: {{ $json.TOKEN_HASH }}`

### Nó HTTP Request - Status do Pedido
- **Method:** GET
- **URL:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id={{ $json.orders[0].order_id }}`
- **Headers:** `x-agent-token: {{ $json.TOKEN_HASH }}`

---

## CHECKLIST FINAL

### Testes de Sucesso
- [ ] Buscar pedidos por telefone retorna lista correta
- [ ] Pedidos são dos últimos 90 dias
- [ ] Pedidos ordenados por data DESC
- [ ] Normalização de telefone funciona para todos os formatos
- [ ] Buscar status por order_id retorna dados corretos
- [ ] Status técnico e label amigável estão corretos
- [ ] Campos retornados seguem o contrato

### Testes de Erro
- [ ] Sem token retorna erro apropriado
- [ ] Token inválido retorna erro apropriado
- [ ] Token sem scope retorna erro apropriado
- [ ] Parâmetros faltando retornam erro apropriado
- [ ] Order ID inexistente retorna erro apropriado

### Validação de Banco
- [ ] Consulta SQL de pedidos retorna mesmo resultado que endpoint
- [ ] Status no banco confere com resposta do endpoint
- [ ] Updated_at confere com banco
- [ ] Normalização de telefone funciona corretamente

### Edge Cases
- [ ] Telefone com pedidos antigos (mais de 90 dias) não aparecem
- [ ] Telefone sem pedidos retorna array vazio
- [ ] Ordem ID inválido retorna erro
- [ ] Campos nulos são tratados corretamente

---

## RESUMO DOS ENDPOINTS

| Endpoint | Método | Query Params | Scope |
|----------|--------|--------------|-------|
| `agent_find_recent_orders_by_phone` | GET | `phone` (obrigatório) | `orders:read` |
| `agent_get_order_status` | GET | `order_id` (obrigatório) | `orders:read` |

---

## NOTAS IMPORTANTES

1. **Status HTTP**: Todos os endpoints retornam **sempre status 200** mesmo em erros. O sucesso/falha é determinado pelo campo `ok`.

2. **Normalização de Telefone**: O endpoint aceita qualquer formato de telefone e normaliza automaticamente para E.164 (padrão brasileiro com código 55).

3. **Período de 90 dias**: Apenas pedidos criados nos últimos 90 dias são retornados. Pedidos mais antigos são ignorados.

4. **Ordem dos Resultados**: Pedidos são sempre ordenados do mais recente para o mais antigo (`created_at DESC`).

5. **Limit de Resultados**: Máximo de 50 pedidos por requisição.

6. **Autenticação**: O token é validado na tabela `agent_tokens` onde:
   - `token_hash` deve corresponder ao hash do token
   - `active` deve ser `true`
   - `scopes` deve incluir `orders:read`

7. **CORS**: Todos os endpoints suportam preflight requests OPTIONS.

---

## STATUS FINAL

✅ Todos os 2 endpoints implementados
✅ Autenticação via `x-agent-token`
✅ Scope `orders:read` necessário
✅ Normalização automática de telefone
✅ Filtro de 90 dias implementado
✅ Ordenação por data DESC
✅ Respostas seguem o contrato especificado
✅ Documentação completa de validação

**Próximo passo:** Realizar testes manuais no n8n seguindo este checklist.
