# API Reference - Integracao IA e n8n

**URL base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Autenticacao do agente:** header `x-agent-token: {TOKEN_HASH}`

Esta referencia descreve a superficie atualmente implementada nas Supabase Edge Functions do projeto.

---

## Indice

1. [Produtos](#produtos)
2. [Pedidos](#pedidos)
3. [Leads e interesses](#leads-e-interesses)
4. [Montadores](#montadores)
5. [Webhooks](#webhooks)
6. [Scopes](#scopes)
7. [Observacoes de contrato](#observacoes-de-contrato)

---

## Produtos

### 1. Buscar produtos

**Endpoint:** `agent_products_search`

**Metodo:** `GET`

**Scope:** `products:read`

**Query params:**

- `q` opcional: termo de busca em nome e descricao.
- `category` opcional: slug da categoria.
- `limit` opcional: padrao `10`, maximo `50`.

**Resposta de sucesso:**

```json
{
  "ok": true,
  "products": [
    {
      "id": "uuid",
      "name": "Sofa 3 Lugares",
      "short_description": "Descricao curta...",
      "category_slug": "sofas",
      "category_name": "Sofas",
      "image": "url",
      "public_url": "https://site.com/product/uuid"
    }
  ],
  "count": 1
}
```

### 2. Produto por ID

**Endpoint:** `agent_product_by_id`

**Metodo:** `GET`

**Scope:** `products:read`

**Scope adicional:** `products:read_private` para dados privados.

**Query params:**

- `id` obrigatorio: UUID do produto.

**Resposta de sucesso:**

```json
{
  "ok": true,
  "product": {
    "id": "uuid",
    "name": "Sofa 3 Lugares",
    "description": "Descricao completa",
    "images": ["url1", "url2"],
    "categories": [
      {
        "id": "uuid",
        "name": "Sofas",
        "slug": "sofas"
      }
    ],
    "public_url": "https://site.com/product/uuid",
    "raw": {
      "metadata": {}
    },
    "private": null
  }
}
```

Com `products:read_private`, o campo `private` pode incluir:

- `internal_code`
- `price`
- `currency`
- `payment_terms`
- `notes`
- `dimensions`
- `stock_status`

---

## Pedidos

### 3. Buscar pedidos recentes por telefone

**Endpoint:** `agent_find_recent_orders_by_phone`

**Metodo:** `GET`

**Scope:** `orders:read`

**Query params:**

- `phone` obrigatorio: telefone em qualquer formato comum no Brasil.

**Regras:**

- Normaliza telefone para formato numerico com DDI `55`.
- Retorna apenas pedidos dos ultimos 90 dias.
- Ordena por `created_at` do mais recente para o mais antigo.
- Limite de 50 resultados.

**Resposta de sucesso:**

```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "uuid",
      "product_name": "Em Montagem",
      "created_at": "2026-01-15T10:30:00.000Z",
      "order_stage": "assembly",
      "updated_at": "2026-01-16T14:20:00.000Z"
    }
  ],
  "count": 1
}
```

**Limitacao conhecida:** neste endpoint, `product_name` hoje recebe o label do estagio do pedido, nao o nome real do produto.

### 4. Status do pedido

**Endpoint:** `agent_get_order_status`

**Metodo:** `GET`

**Scope:** `orders:read`

**Query params:**

- `order_id` obrigatorio: UUID do pedido.

**Resposta de sucesso:**

```json
{
  "ok": true,
  "order": {
    "order_id": "uuid",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "2026-01-16T14:20:00.000Z",
    "product_name": "PED-2026-001"
  }
}
```

**Status possiveis:**

- `order_created`: Pedido Criado
- `preparing_order`: Preparando Pedido
- `assembly`: Em Montagem
- `ready_to_ship`: Pronto para Envio
- `delivery_route`: Em Rota de Entrega
- `delivered`: Entregue
- `canceled`: Cancelado

---

## Leads e interesses

### 5. Criar lead

**Endpoint:** `agent_create_lead`

**Metodo:** `POST`

**Scope:** `leads:write`

**Body:**

```json
{
  "name": "Joao Silva",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "Lead criado via IA"
}
```

**Campos obrigatorios:**

- `name`
- `phone`

**Resposta de sucesso:**

```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "uuid",
    "name": "Joao Silva",
    "phone": "11999999999",
    "channel": "site",
    "status": "new_interest",
    "created_at": "2026-01-01T12:00:00.000Z"
  }
}
```

### 6. Criar ou registrar interesse de lead

**Endpoint:** `agent_create_lead_interest`

**Metodo:** `POST`

**Scope:** `leads:write`

Este endpoint e recomendado para fluxos de conversa no n8n, porque procura lead existente pelo telefone, cria se necessario e registra o interesse na timeline.

**Body:**

```json
{
  "customer_name": "Joao Silva",
  "customer_phone": "11999999999",
  "message": "Tenho interesse nesse produto",
  "source": "n8n",
  "context": {
    "intent": "catalog_interest",
    "product_id": "uuid-do-produto",
    "product_name": "Sofa 3 Lugares",
    "category_slug": "sofas"
  }
}
```

**Campos obrigatorios:**

- `customer_phone`
- `message`

**Resposta de sucesso:**

```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead_id": "uuid",
  "created": true,
  "timeline_created": true,
  "lead": {
    "id": "uuid",
    "name": "Joao Silva",
    "phone": "11999999999",
    "channel": "ai_assistant",
    "status": "new_interest"
  }
}
```

### 7. Atualizar status do lead

**Endpoint:** `agent_update_lead_status`

**Metodo:** `POST`

**Scope:** `leads:update`

**Body:**

```json
{
  "lead_id": "uuid",
  "status": "talking_human"
}
```

**Resposta de sucesso:**

```json
{
  "ok": true,
  "message": "Lead status updated successfully",
  "lead_id": "uuid",
  "old_status": "new_interest",
  "new_status": "talking_human"
}
```

### 8. Adicionar nota ao lead

**Endpoint:** `agent_add_lead_note`

**Metodo:** `POST`

**Scope:** `leads:write`

**Body:**

```json
{
  "lead_id": "uuid",
  "message": "Cliente pediu prazo de entrega"
}
```

**Resposta de sucesso:**

```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "uuid",
  "note": {
    "id": "uuid",
    "message": "Cliente pediu prazo de entrega",
    "created_at": "2026-01-01T12:00:00.000Z"
  }
}
```

---

## Montadores

### 9. Lista de montadores

**Endpoint:** `agent_get_assemblers`

**Metodo:** `GET`

**Scope:** `leads:read` ou `products:read`

**Query params:**

- `city` opcional: filtro por cidade.
- `limit` opcional: padrao `20`, maximo `50`.

**Resposta de sucesso:**

```json
{
  "ok": true,
  "assemblers": [
    {
      "id": "uuid",
      "name": "Carlos Oliveira",
      "phone": "11988887777",
      "city": "Sao Paulo",
      "bio": "Montador parceiro",
      "photo_url": "url"
    }
  ],
  "count": 1
}
```

---

## Webhooks

### Dispatcher

**Endpoint:** `webhooks_dispatch`

**Metodo:** `POST`

**Body esperado:**

```json
{
  "endpointId": "uuid-opcional",
  "envelope": {
    "version": "1.0",
    "event_type": "webhook.test",
    "event_id": "uuid",
    "occurred_at": "2026-01-01T12:00:00.000Z",
    "source": {
      "app": "moveis-nascimento",
      "env": "production",
      "channel": "crm"
    },
    "data": {},
    "meta": {}
  }
}
```

Se `endpointId` for informado, dispara apenas para esse endpoint. Se nao for informado, busca endpoints ativos cujo array `events` contenha `event_type`.

**Eventos usados pelo app:**

- `lead.created`
- `opportunity.created`
- `opportunity.stage_changed`
- `order.created`
- `order.stage_changed`
- `home_ambience_click`
- `webhook.test`

---

## Scopes

| Scope | Permissao | Endpoints |
|-------|-----------|-----------|
| `products:read` | Ler produtos publicos | `agent_products_search`, `agent_product_by_id`, `agent_get_assemblers` |
| `products:read_private` | Ler dados privados de produtos | `agent_product_by_id` |
| `orders:read` | Ler pedidos | `agent_find_recent_orders_by_phone`, `agent_get_order_status` |
| `leads:read` | Leitura auxiliar | `agent_get_assemblers` |
| `leads:write` | Criar leads e notas | `agent_create_lead`, `agent_create_lead_interest`, `agent_add_lead_note` |
| `leads:update` | Atualizar status de lead | `agent_update_lead_status` |

---

## Observacoes de contrato

- Os endpoints de leads, pedidos e montadores retornam erros como HTTP 200 com `{ "ok": false, "error": "..." }`.
- Os endpoints de produtos usam status HTTP convencionais em alguns erros (`400`, `401`, `403`, `404`, `500`), mas tambem retornam `ok:false`.
- O n8n pode validar erro por `ok === false` em todos os endpoints de agente e ainda tratar status HTTP diferente de 2xx nos endpoints de produtos.
- O `token_hash` deve ser enviado no header `x-agent-token`; nao use token em texto livre no fluxo.
- Operacoes de lead registram eventos em `lead_timeline` e atualizam atividade quando aplicavel.

---

## Resumo

| # | Endpoint | Metodo | Scope |
|---|----------|--------|-------|
| 1 | `agent_products_search` | GET | `products:read` |
| 2 | `agent_product_by_id` | GET | `products:read` |
| 3 | `agent_find_recent_orders_by_phone` | GET | `orders:read` |
| 4 | `agent_get_order_status` | GET | `orders:read` |
| 5 | `agent_create_lead` | POST | `leads:write` |
| 6 | `agent_create_lead_interest` | POST | `leads:write` |
| 7 | `agent_update_lead_status` | POST | `leads:update` |
| 8 | `agent_add_lead_note` | POST | `leads:write` |
| 9 | `agent_get_assemblers` | GET | `leads:read` ou `products:read` |

**Total:** 9 endpoints de agente, alem do dispatcher `webhooks_dispatch`.

**Ultima revisao local:** 2026-06-02
