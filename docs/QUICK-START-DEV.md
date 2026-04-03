# Quick Start - API de Integração

**Para desenvolvedores** - Comece aqui!

---

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Token

```sql
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token Dev',
  'seu_token_hash_aqui',
  ARRAY['products:read', 'orders:read'],
  true
);
```

### 2. Testar Conexão

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?limit=1" \
  -H "x-agent-token: seu_token_hash_aqui"
```

### 3. Verificar Resposta

**Sucesso:**
```json
{
  "ok": true,
  "products": [...],
  "count": 1
}
```

**Erro:**
```json
{
  "ok": false,
  "error": "..."
}
```

---

## 📋 Todos os Endpoints

| Endpoint | Método | Scope | Descrição |
|----------|--------|-------|-----------|
| `agent_products_search` | GET | `products:read` | Buscar produtos |
| `agent_product_by_id` | GET | `products:read` | Produto por ID |
| `agent_find_recent_orders_by_phone` | GET | `orders:read` | Pedidos por telefone |
| `agent_get_order_status` | GET | `orders:read` | Status do pedido |
| `agent_get_assemblers` | GET | `leads:read` ou `products:read` | Lista de montadores |
| `agent_create_lead` | POST | `leads:write` | Criar lead |
| `agent_update_lead_status` | POST | `leads:update` | Atualizar status |
| `agent_add_lead_note` | POST | `leads:write` | Adicionar nota |

---

## 🔐 Autenticação

### Header Necessário

```
x-agent-token: {TOKEN_HASH}
```

### Scopes

| Scope | O que permite |
|-------|---------------|
| `products:read` | Ler produtos |
| `products:read_private` | Ler preços/estoque |
| `orders:read` | Ler pedidos |
| `leads:read` | Ler leads |
| `leads:write` | Criar/modificar leads |
| `leads:update` | Atualizar status |

---

## 📦 Exemplos Rápidos

### Buscar Produtos

```bash
curl "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?limit=10" \
  -H "x-agent-token: seu_token"
```

### Rastrear Pedido

```bash
curl "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "x-agent-token: seu_token"
```

### Criar Lead

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token" \
  -d '{"name": "João", "phone": "11999999999"}'
```

---

## ❌ Erros Comuns

| Erro | Causa | Solução |
|------|-------|----------|
| `Missing x-agent-token header` | Sem token no header | Adicione header `x-agent-token` |
| `Invalid or inactive token` | Token inválido | Verifique token no banco |
| `Insufficient permissions` | Sem scope | Adicione scope ao token |
| `Missing required parameter` | Parâmetro faltando | Envie parâmetro obrigatório |
| `{Resource} not found` | ID não existe | Verifique o ID |

---

## 📚 Documentação Completa

- **[Manual Completo](./MANUAL-INTEGRACAO-API.md)** - Detalhes de todos os endpoints
- **[Exemplos JSON](./exemplos-json-prontos.md)** - Exemplos prontos para copiar
- **[API Reference](./API-REFERENCE.md)** - Referência rápida

---

**Pronto para desenvolver!** 🎉
