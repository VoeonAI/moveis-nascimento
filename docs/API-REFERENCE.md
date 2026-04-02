# API Reference - Endpoints de Integração IA

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Autenticação:** `x-agent-token: {TOKEN_HASH}`

---

## 📋 Índice

1. [Gerenciamento de Leads](#gerenciamento-de-leads)
2. [Consulta de Produtos](#consulta-de-produtos)
3. [Rastreio de Pedidos](#rastreio-de-pedidos)
4. [Consultas Diversas](#consultas-diversas)
5. [Scopes](#scopes)
6. [Erros Comuns](#erros-comuns)

---

## 📝 Gerenciamento de Leads

### 1. Criar Lead

**Endpoint:** `agent_create_lead`  
**Método:** `POST`  
**Scope:** `leads:write`

**Request:**
```bash
POST /agent_create_lead
Headers: { "x-agent-token": "...", "Content-Type": "application/json" }
Body: {
  "name": "João Silva",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "Lead criado via IA"
}
```

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
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 2. Atualizar Status do Lead

**Endpoint:** `agent_update_lead_status`  
**Método:** `POST`  
**Scope:** `leads:update`

**Request:**
```bash
POST /agent_update_lead_status
Headers: { "x-agent-token": "...", "Content-Type": "application/json" }
Body: {
  "lead_id": "uuid-do-lead",
  "status": "talking_human"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Lead status updated successfully",
  "lead_id": "uuid-do-lead",
  "old_status": "new_interest",
  "new_status": "talking_human"
}
```

**Status Disponíveis:**
- `new_interest` - Novo Interesse
- `talking_ai` - Falando com IA
- `talking_human` - Falando com Humano
- `proposal_sent` - Proposta Enviada
- `won` - Ganho
- `lost` - Perdido

---

### 3. Adicionar Nota ao Lead

**Endpoint:** `agent_add_lead_note`  
**Método:** `POST`  
**Scope:** `leads:write`

**Request:**
```bash
POST /agent_add_lead_note
Headers: { "x-agent-token": "...", "Content-Type": "application/json" }
Body: {
  "lead_id": "uuid-do-lead",
  "message": "Cliente demonstrou interesse no produto"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "uuid-do-lead",
  "note": {
    "id": "uuid-da-nota",
    "message": "Cliente demonstrou interesse no produto",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 📦 Consulta de Produtos

### 4. Buscar Produtos

**Endpoint:** `agent_products_search`  
**Método:** `GET`  
**Scope:** `products:read`

**Request:**
```bash
GET /agent_products_search?q=solar&category=modulos&limit=10
Headers: { "x-agent-token": "..." }
```

**Query Params (opcional):**
- `q`: Termo de busca (busca em nome e descrição)
- `category`: Slug da categoria
- `limit`: Quantidade de resultados (padrão: 10, máximo: 50)

**Response:**
```json
{
  "ok": true,
  "products": [
    {
      "id": "uuid",
      "name": "Módulo Solar 400W",
      "short_description": "Painel solar de alta eficiência...",
      "category_slug": "modulos-solares",
      "category_name": "Módulos Solares",
      "image": "https://url-da-imagem.jpg",
      "public_url": "https://site.com/product/uuid"
    }
  ],
  "count": 1
}
```

---

### 5. Produto por ID

**Endpoint:** `agent_product_by_id`  
**Método:** `GET`  
**Scope:** `products:read` (+ `products:read_private` para dados sensíveis)

**Request:**
```bash
GET /agent_product_by_id?id=uuid-do-produto
Headers: { "x-agent-token": "..." }
```

**Response:**
```json
{
  "ok": true,
  "product": {
    "id": "uuid",
    "name": "Módulo Solar 400W",
    "description": "Descrição completa...",
    "images": ["url1.jpg", "url2.jpg"],
    "categories": [
      {
        "id": "uuid",
        "name": "Módulos Solares",
        "slug": "modulos-solares"
      }
    ],
    "public_url": "https://site.com/product/uuid",
    "private": {
      "internal_code": "MOD-400W-01",
      "price": 1500.00,
      "currency": "BRL",
      "payment_terms": "À vista ou parcelado",
      "stock_status": "sob_consulta"
    }
  }
}
```

**Nota:** Campo `private` só é preenchido se o token tiver scope `products:read_private`.

---

## 🚚 Rastreio de Pedidos

### 6. Buscar Pedidos por Telefone

**Endpoint:** `agent_find_recent_orders_by_phone`  
**Método:** `GET`  
**Scope:** `orders:read`

**Request:**
```bash
GET /agent_find_recent_orders_by_phone?phone=5511999999999
Headers: { "x-agent-token": "..." }
```

**Query Params:**
- `phone` (obrigatório): Telefone em qualquer formato

**Regras:**
- Apenas pedidos dos últimos 90 dias
- Ordenado do mais recente para o mais antigo
- Limite de 50 resultados
- Telefone normalizado automaticamente para E.164

**Response:**
```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "uuid",
      "product_name": "Em Montagem",
      "created_at": "2024-01-15T10:30:00.000Z",
      "order_stage": "assembly",
      "updated_at": "2024-01-16T14:20:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 7. Status do Pedido

**Endpoint:** `agent_get_order_status`  
**Método:** `GET`  
**Scope:** `orders:read`

**Request:**
```bash
GET /agent_get_order_status?order_id=uuid-do-pedido
Headers: { "x-agent-token": "..." }
```

**Response:**
```json
{
  "ok": true,
  "order": {
    "order_id": "uuid",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "2024-01-16T14:20:00.000Z",
    "product_name": "PED-2024-001"
  }
}
```

**Status Disponíveis:**
| Status Técnico | Label Amigável |
|----------------|----------------|
| `order_created` | Pedido Criado |
| `preparing_order` | Preparando Pedido |
| `assembly` | Em Montagem |
| `ready_to_ship` | Pronto para Envio |
| `delivery_route` | Em Rota de Entrega |
| `delivered` | Entregue |
| `canceled` | Cancelado |

---

## 👷 Consultas Diversas

### 8. Buscar Montadores

**Endpoint:** `agent_get_assemblers`  
**Método:** `GET`  
**Scope:** `leads:read` ou `products:read`

**Request:**
```bash
GET /agent_get_assemblers?city=São+Paulo&limit=10
Headers: { "x-agent-token": "..." }
```

**Query Params (opcional):**
- `city`: Filtrar por cidade (busca parcial)
- `limit`: Quantidade de resultados (padrão: 20, máximo: 50)

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
      "bio": "Especialista em montagem de painéis solares",
      "photo_url": "https://url-da-foto.jpg"
    }
  ],
  "count": 1
}
```

---

## 🔐 Scopes

| Scope | Descrição | Endpoints |
|-------|-----------|-----------|
| `leads:read` | Ler leads e oportunidades | Buscar montadores |
| `leads:write` | Criar e modificar leads | Criar lead, Adicionar nota |
| `leads:update` | Atualizar status de leads | Atualizar status |
| `products:read` | Ler produtos públicos | Buscar produtos, Produto por ID, Buscar montadores |
| `products:read_private` | Ler dados privados de produtos | Produto por ID (opcional) |
| `orders:read` | Ler pedidos | Buscar pedidos por telefone, Status do pedido |

---

## ❌ Erros Comuns

### Todos os endpoints retornam HTTP 200 mesmo em erro.

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
  "error": "Missing required field: X"
}
```

### Recurso Não Encontrado
```json
{
  "ok": false,
  "error": "Lead not found"
}
```

---

## 📊 Resumo dos Endpoints

| # | Endpoint | Método | Scope | Categoria |
|---|----------|--------|-------|-----------|
| 1 | `agent_create_lead` | POST | `leads:write` | Leads |
| 2 | `agent_update_lead_status` | POST | `leads:update` | Leads |
| 3 | `agent_add_lead_note` | POST | `leads:write` | Leads |
| 4 | `agent_products_search` | GET | `products:read` | Produtos |
| 5 | `agent_product_by_id` | GET | `products:read` | Produtos |
| 6 | `agent_find_recent_orders_by_phone` | GET | `orders:read` | Rastreio |
| 7 | `agent_get_order_status` | GET | `orders:read` | Rastreio |
| 8 | `agent_get_assemblers` | GET | `leads:read` / `products:read` | Diversos |

**Total:** 8 endpoints

---

## 🎯 Uso Rápido

### Criar token no banco:
```sql
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token IA Completo',
  'seu_token_hash_aqui',
  ARRAY['leads:read', 'leads:write', 'leads:update', 'products:read', 'orders:read'],
  true
);
```

### Testar endpoint:
```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?limit=1" \
  -H "x-agent-token: seu_token_hash_aqui"
```

---

## 📚 Documentação Completa

- [Validação Completa - Leads/Produtos](./validacao-endpoints-ia.md)
- [Validação - Rastreio de Pedidos](./validacao-rastreio-pedidos.md)
- [Checklist n8n - Leads/Produtos](./checklist-validacao-n8n.md)
- [Guia n8n - Leads/Produtos](./guia-n8n-node-config.md)
- [Guia n8n - Rastreio](./guia-n8n-rastreio-pedidos.md)
- [Payloads - Leads/Produtos](./payloads-exemplo.json)
- [Payloads - Rastreio](./payloads-rastreio-pedidos.json)

---

**Última atualização:** 2024  
**Versão:** 1.0
