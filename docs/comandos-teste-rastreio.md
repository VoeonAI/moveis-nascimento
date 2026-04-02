# Comandos de Teste - Rastreio de Pedidos

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Token Hash:** `test_order_tracking_token_hash_12345`

---

## 🧪 Comandos cURL para Teste

### TESTE 1: Telefone com máscara

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=%2811%29%2097777-7777" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** 1 pedido (PED-TEST-005)

---

### TESTE 2: Telefone sem máscara

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** 2 pedidos (PED-TEST-001 e PED-TEST-002)

---

### TESTE 3: Telefone com DDI (+55)

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=%2B55%2011%2099999-9999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** 2 pedidos (PED-TEST-001 e PED-TEST-002)

---

### TESTE 4: Telefone sem código país

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=11999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** 1 pedido (PED-TEST-004)

---

### TESTE 5: Filtro de 90 dias

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Validação SQL:**
```sql
SELECT COUNT(*) 
FROM orders 
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days';
-- Esperado: 2 (deve ser 2, não 3)
```

**Esperado:** 2 pedidos (NÃO deve incluir PED-OLD-001)

---

### TESTE 6: Telefone sem pedidos

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511777777777" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** Array vazio (`{"ok":true,"orders":[],"count":0}`)

---

### TESTE 7: Pedido recente válido

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=9da3c1eb-7eaf-4484-99d2-654f6bf0c1be" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Validação SQL:**
```sql
SELECT id, current_stage, updated_at, internal_code
FROM orders
WHERE id = '9da3c1eb-7eaf-4484-99d2-654f6bf0c1be';
```

**Esperado:**
```json
{
  "ok": true,
  "order": {
    "order_id": "9da3c1eb-7eaf-4484-99d2-654f6bf0c1be",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "...",
    "product_name": "PED-TEST-001"
  }
}
```

---

### TESTE 8: Pedido antigo (fora de 90 dias)

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=37082245-537f-4ffb-b057-2406a5bd93c1" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** Pedido retornado (NÃO aplica filtro de 90 dias neste endpoint)

---

### TESTE 9: order_id inexistente

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** `{"ok":false,"error":"Order not found"}`

---

### TESTE 10: Sem token

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json"
```

**Esperado:** `{"ok":false,"error":"Missing x-agent-token header"}`

---

### TESTE 11: Token inválido

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: token_invalido_12345"
```

**Esperado:** `{"ok":false,"error":"Invalid or inactive token"}`

---

### TESTE 12: Token sem scope orders:read

Primeiro, criar token sem scope:
```sql
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES ('Token Sem Scope', 'token_sem_scope_12345', ARRAY['products:read'], true)
RETURNING id, name, token_hash, scopes;
```

Depois, testar:
```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: token_sem_scope_12345"
```

**Esperado:** `{"ok":false,"error":"Insufficient permissions"}`

---

### TESTE 13: Parâmetro phone faltando

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** `{"ok":false,"error":"Missing required parameter: phone"}`

---

### TESTE 14: Parâmetro order_id faltando

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: test_order_tracking_token_hash_12345"
```

**Esperado:** `{"ok":false,"error":"Missing required parameter: order_id"}`

---

## 📊 Queries SQL de Validação

### Validar normalização de telefone

```sql
-- Todos estes formatos devem gerar o mesmo telefone normalizado: 5511999999999
SELECT 
  '5511999999999' as formato, 
  REGEXP_REPLACE('5511999999999', '\D', '', 'g') as normalizado
UNION ALL
SELECT '11999999999', '55' + '11999999999'
UNION ALL
SELECT '(11) 99999-9999', '55' + '11999999999'
UNION ALL
SELECT '+55 11 99999-9999', '55' + '11999999999';
```

### Validar filtro de 90 dias

```sql
-- Total de pedidos com telefone 5511999999999
SELECT COUNT(*) as total_pedidos
FROM orders
WHERE customer_phone = '5511999999999';
-- Resultado: 3

-- Apenas pedidos recentes (últimos 90 dias)
SELECT COUNT(*) as pedidos_recentes
FROM orders
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days';
-- Resultado: 2

-- Pedidos antigos (fora de 90 dias)
SELECT id, current_stage, created_at
FROM orders
WHERE customer_phone = '5511999999999'
  AND created_at < NOW() - INTERVAL '90 days';
-- Resultado: 1 (PED-OLD-001)
```

### Validar dados do pedido

```sql
SELECT 
  id,
  current_stage,
  internal_code,
  created_at,
  updated_at
FROM orders
WHERE id = '9da3c1eb-7eaf-4484-99d2-654f6bf0c1be';
-- Deve retornar: assembly, PED-TEST-001
```

---

## 🎯 Checklist de Validação

### Para cada comando cURL:

- [ ] Executar comando
- [ ] Verificar HTTP status (deve ser 200)
- [ ] Verificar campo `ok` na resposta
- [ ] Verificar se dados conferem com SQL
- [ ] Documentar resultado (PASSOU/FALHOU)

### Para validação SQL:

- [ ] Executar query
- [ ] Comparar com resposta da API
- [ ] Verificar consistência dos dados
- [ ] Documentar resultado

---

## 📝 Resultados Esperados

| Teste | HTTP Status | Campo ok | Comportamento |
|-------|-------------|-----------|---------------|
| 1 | 200 | true | 1 pedido |
| 2 | 200 | true | 2 pedidos |
| 3 | 200 | true | 2 pedidos (normalizado) |
| 4 | 200 | true | 1 pedido (adicionou 55) |
| 5 | 200 | true | 2 pedidos (exclui antigo) |
| 6 | 200 | true | Array vazio |
| 7 | 200 | true | Pedido retornado |
| 8 | 200 | true | Pedido retornado (sem filtro) |
| 9 | 200 | false | Erro: Order not found |
| 10 | 200 | false | Erro: Missing x-agent-token header |
| 11 | 200 | false | Erro: Invalid or inactive token |
| 12 | 200 | false | Erro: Insufficient permissions |
| 13 | 200 | false | Erro: Missing required parameter: phone |
| 14 | 200 | false | Erro: Missing required parameter: order_id |

---

## 🔍 Observações Importantes

1. **Todos os erros retornam HTTP 200** (conforme contrato)
2. **Verificar sempre o campo `ok`** para determinar sucesso/falha
3. **Normalização de telefone** deve funcionar para todos os formatos
4. **Filtro de 90 dias** apenas em `agent_find_recent_orders_by_phone`
5. **agent_get_order_status** NÃO filtra por 90 dias
6. **Consistência com banco** deve ser verificada com SQL

---

## ⚠️ Limitações Conhecidas

### product_name em agent_find_recent_orders_by_phone

O campo `product_name` está sendo preenchido com o **label do estágio** (ex: "Em Montagem"), não com o nome real do produto.

**Contrato:** ✅ CUMPRIDO (campo existe e é retornado)
**Funcionalidade:** ⚠️ LIMITADA (não retorna nome real do produto)

**Razão:** A tabela `orders` não tem uma relação direta com `products` através de `opportunity_id`, e o contrato especificava não depender de `opportunities`.

**Solução futura (se necessário):**
- Adicionar campo `product_name` diretamente na tabela `orders`
- Ou fazer join com `opportunities` e `products` (viola contrato atual)
- Ou usar `internal_code` como `product_name` (já implementado em `agent_get_order_status`)

---

**Pronto para execução dos testes!**
