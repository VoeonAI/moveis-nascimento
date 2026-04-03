# API Reference - Endpoints de Integração IA

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Autenticação:** `x-agent-token: {TOKEN_HASH}`

---

## 📋 Índice

1. [Produtos](#produtos)
2. [Pedidos](#pedidos)
3. [Leads](#leads)
4. [Montadores](#montadores)
5. [Scopes](#scopes)
6. [Erros Comuns](#erros-comuns)

---

## Produtos

### 1. Buscar Produtos

**Endpoint:** `agent_products_search`  
**Método:** `GET`  
**Scope:** `products:read`

**Query Params:**
- `q` (opcional): Termo de busca
- `category` (opcional): Slug da categoria
- `limit` (opcional, padrão: 10, máx: 50): Quantidade

**Response:**
```json
{
  "ok": true,
  "products": [
    {
      "id": "uuid",
      "name": "Módulo Solar 400W",
      "short_description": "...",
      "category_slug": "modulos-solares",
      "category_name": "Módulos Solares",
      "image": "url",
      "public_url": "url"
    }
  ],
  "count": 1
}
```

---

### 2. Produto por ID

**Endpoint:** `agent_product_by_id`  
**Método:** `GET`  
**Scope:** `products:read` (+ `products:read_private` opcional)

**Query Params:**
- `id` (obrigatório): UUID do produto

**Response:**
```json
{
  "ok": true,
  "product": {
    "id": "uuid",
    "name": "Módulo Solar 400W",
    "description": "...",
    "images": ["url1", "url2"],
    "categories": [...],
    "public_url": "url",
    "private": {
      "internal_code": "...",
      "price": 1500.00,
      "stock_status": "disponivel"
    } // null se não tiver scope
  }
}
```

---

## Pedidos

### 3. Buscar Pedidos por Telefone

**Endpoint:** `agent_find_recent_orders_by_phone`  
**Método:** `GET`  
**Scope:** `orders:read`

**Query Params:**
- `phone` (obrigatório): Telefone em qualquer formato

**Regras:**
- Apenas últimos 90 dias
- Ordenado mais recente → mais antigo
- Telefone normalizado automaticamente

**Response:**
```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "uuid",
      "product_name": "Em Montagem",
      "created_at": "...",
      "order_stage": "assembly",
      "updated_at": "..."
    }
  ],
  "count": 1
}
```

---

### 4. Status do Pedido

**Endpoint:** `agent_get_order_status`  
**Método:** `GET`  
**Scope:** `orders:read`

**Query Params:**
- `order_id` (obrigatório): UUID do pedido

**Status Possíveis:**
- `order_created` - Pedido Criado
- `preparing_order` - Preparando Pedido
- `assembly` - Em Montagem
- `ready_to_ship` - Pronto para Envio
- `delivery_route` - Em Rota de Entrega
- `delivered` - Entregue
- `canceled` - Cancelado

**Response:**
```json
{
  "ok": true,
  "order": {
    "order_id": "uuid",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "...",
    "product_name": "PED-2024-001"
  }
}
```

---

## Leads

### 5. Criar Lead

**Endpoint:** `agent_create_lead`  
**Método:** `POST`  
**Scope:** `leads:write`

**Body:**
```json
{
  "name": "João Silva",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "..."
}
```

**Valores Opcionais:**
- `channel`: `site`, `whatsapp`, `instagram`, `facebook`, `google`
- `status`: `new_interest`, `talking_ai`, `talking_human`, `proposal_sent`, `won`, `lost`

**Response:**
```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "site",
    "status": "new_interest",
    "created_at": "..."
  }
}
```

---

### 6. Atualizar Status do Lead

**Endpoint:** `agent_update_lead_status`  
**Método:** `POST`  
**Scope:** `leads:update`

**Body:**
```json
{
  "lead_id": "uuid",
  "status": "talking_human"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Lead status updated successfully",
  "lead_id": "uuid",
  "old_status": "new_interest",
  "new_status": "talking_human"
}
```

---

### 7. Adicionar Nota ao Lead

**Endpoint:** `agent_add_lead_note`  
**Método:** `POST`  
**Scope:** `leads:write`

**Body:**
```json
{
  "lead_id": "uuid",
  "message": "Nota sobre o cliente"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "uuid",
  "note": {
    "id": "uuid",
    "message": "...",
    "created_at": "..."
  }
}
```

---

## Montadores

### 8. Lista de Montadores

**Endpoint:** `agent_get_assemblers`  
**Método:** `GET`  
**Scope:** `leads:read` ou `products:read`

**Query Params:**
- `city` (opcional): Filtrar por cidade
- `limit` (opcional, padrão: 20, máx: 50): Quantidade

**Response:**
```json
{
  "ok": true,
  "assemblers": [
    {
      "id": "uuid",
      "name": "Carlos Oliveira",
      "phone": "11988887777",
      "city": "São Paulo",
      "bio": "...",
      "photo_url": "url"
    }
  ],
  "count": 1
}
```

---

## Scopes

| Scope | Descrição | Endpoints |
|-------|-----------|-----------|
| `leads:read` | Ler leads e oportunidades | agent_get_assemblers |
| `leads:write` | Criar/modificar leads | agent_create_lead, agent_add_lead_note |
| `leads:update` | Atualizar status | agent_update_lead_status |
| `products:read` | Ler produtos | agent_products_search, agent_product_by_id, agent_get_assemblers |
| `products:read_private` | Ler preços/estoque | agent_product_by_id (opcional) |
| `orders:read` | Ler pedidos | agent_find_recent_orders_by_phone, agent_get_order_status |

---

## Erros Comuns

Todos retornam HTTP 200, verifique campo `ok`.

### Sem Token
```json
{
  "ok": false,
  "error": "Missing x-agent-token header"
}
```

### Token Inválido
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

### Sem Permissão
```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

### Parâmetro Faltando
```json
{
  "ok": false,
  "error": "Missing required parameter: {param}"
}
```

### Recurso Não Encontrado
```json
{
  "ok": false,
  "error": "{Resource} not found"
}
```

---

## Resumo

| # | Endpoint | Método | Scope |
|---|----------|--------|-------|
| 1 | `agent_products_search` | GET | `products:read` |
| 2 | `agent_product_by_id` | GET | `products:read` |
| 3 | `agent_find_recent_orders_by_phone` | GET | `orders:read` |
| 4 | `agent_get_order_status` | GET | `orders:read` |
| 5 | `agent_create_lead` | POST | `leads:write` |
| 6 | `agent_update_lead_status` | POST | `leads:update` |
| 7 | `agent_add_lead_note` | POST | `leads:write` |
| 8 | `agent_get_assemblers` | GET | `leads:read` / `products:read` |

**Total:** 8 endpoints

---

**Última atualização:** 2024-03-28  
**Versão:** 2.0
