# Exemplos JSON Prontos - API de Integração

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

---

## 📋 Índice

1. [Exemplos de Request](#exemplos-de-request)
2. [Exemplos de Response - Sucesso](#exemplos-de-response-sucesso)
3. [Exemplos de Response - Erro](#exemplos-de-response-erro)
4. [Comandos cURL Prontos](#comandos-curl-prontos)

---

## Exemplos de Request

### agent_products_search

**GET - Buscar todos os produtos (padrão):**
```bash
GET /agent_products_search
```

**GET - Buscar com termo:**
```bash
GET /agent_products_search?q=solar
```

**GET - Buscar por categoria:**
```bash
GET /agent_products_search?category=modulos-solares
```

**GET - Buscar com limite:**
```bash
GET /agent_products_search?limit=20
```

**GET - Combinação completa:**
```bash
GET /agent_products_search?q=painel&category=modulos-solares&limit=10
```

---

### agent_product_by_id

**GET - Produto específico:**
```bash
GET /agent_product_by_id?id=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### agent_find_recent_orders_by_phone

**GET - Telefone E.164:**
```bash
GET /agent_find_recent_orders_by_phone?phone=5511999999999
```

**GET - Telefone sem código país:**
```bash
GET /agent_find_recent_orders_by_phone?phone=11999999999
```

**GET - Telefone formatado:**
```bash
GET /agent_find_recent_orders_by_phone?phone=(11)%2099999-9999
```

**GET - Telefone com +:**
```bash
GET /agent_find_recent_orders_by_phone?phone=%2B55%2011%2099999-9999
```

---

### agent_get_order_status

**GET - Status do pedido:**
```bash
GET /agent_get_order_status?order_id=ord-001
```

---

### agent_get_assemblers

**GET - Todos os montadores:**
```bash
GET /agent_get_assemblers
```

**GET - Por cidade:**
```bash
GET /agent_get_assemblers?city=São+Paulo
```

**GET - Com limite:**
```bash
GET /agent_get_assemblers?city=Campinas&limit=10
```

---

### agent_create_lead

**POST - Mínimo:**
```json
{
  "name": "João Silva",
  "phone": "11999999999"
}
```

**POST - Completo:**
```json
{
  "name": "João Silva",
  "phone": "11999999999",
  "channel": "whatsapp",
  "status": "new_interest",
  "notes": "Cliente interessado em sistema solar residencial"
}
```

**POST - Com channel:**
```json
{
  "name": "Maria Santos",
  "phone": "11988887777",
  "channel": "site"
}
```

---

### agent_update_lead_status

**POST - Mínimo:**
```json
{
  "lead_id": "lead-001",
  "status": "talking_human"
}
```

**POST - Mudar para proposal_sent:**
```json
{
  "lead_id": "lead-001",
  "status": "proposal_sent"
}
```

---

### agent_add_lead_note

**POST - Mínimo:**
```json
{
  "lead_id": "lead-001",
  "message": "Nota sobre o cliente"
}
```

**POST - Nota detalhada:**
```json
{
  "lead_id": "lead-001",
  "message": "Cliente solicitou orçamento para instalação de 3kWp. Telefone de contato: 11999999999"
}
```

---

## Exemplos de Response - Sucesso

### agent_products_search

```json
{
  "ok": true,
  "products": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Módulo Solar 400W Monocristalino",
      "short_description": "Painel solar de alta eficiência com tecnologia monocristalina...",
      "category_slug": "modulos-solares",
      "category_name": "Módulos Solares",
      "image": "https://storage.exemplo.com/produtos/modulo-400w.jpg",
      "public_url": "https://site.com/product/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
      "name": "Módulo Solar 450W Monocristalino",
      "short_description": "Painel solar de alta performance...",
      "category_slug": "modulos-solares",
      "category_name": "Módulos Solares",
      "image": "https://storage.exemplo.com/produtos/modulo-450w.jpg",
      "public_url": "https://site.com/product/b2c3d4e5-f6g7-8901-bcde-f23456789012"
    }
  ],
  "count": 2
}
```

---

### agent_product_by_id

**Com dados privados:**
```json
{
  "ok": true,
  "product": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Módulo Solar 400W Monocristalino",
    "description": "Painel solar de alta eficiência com tecnologia monocristalina...",
    "images": [
      "https://storage.exemplo.com/produtos/modulo-400w-1.jpg",
      "https://storage.exemplo.com/produtos/modulo-400w-2.jpg"
    ],
    "categories": [
      {
        "id": "cat-001",
        "name": "Módulos Solares",
        "slug": "modulos-solares"
      }
    ],
    "public_url": "https://site.com/product/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "private": {
      "internal_code": "MOD-400W-001",
      "price": 1500.00,
      "currency": "BRL",
      "payment_terms": "À vista ou parcelado em até 12x",
      "notes": "Produto em estoque",
      "dimensions": {
        "length": 1800,
        "width": 1000,
        "height": 35
      },
      "stock_status": "disponivel"
    }
  }
}
```

**Sem dados privados:**
```json
{
  "ok": true,
  "product": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Módulo Solar 400W Monocristalino",
    "description": "Painel solar de alta eficiência com tecnologia monocristalina...",
    "images": [
      "https://storage.exemplo.com/produtos/modulo-400w-1.jpg"
    ],
    "categories": [
      {
        "id": "cat-001",
        "name": "Módulos Solares",
        "slug": "modulos-solares"
      }
    ],
    "public_url": "https://site.com/product/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "private": null
  }
}
```

---

### agent_find_recent_orders_by_phone

```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "9da3c1eb-7eaf-4484-99d2-654f6bf0c1be",
      "product_name": "Em Montagem",
      "created_at": "2024-03-23T10:30:00.000Z",
      "order_stage": "assembly",
      "updated_at": "2024-03-28T14:20:00.000Z"
    },
    {
      "order_id": "1623d8d1-ee01-4dfa-8e7f-cfc76cceec3b",
      "product_name": "Pronto para Envio",
      "created_at": "2024-03-13T09:00:00.000Z",
      "order_stage": "ready_to_ship",
      "updated_at": "2024-03-28T16:45:00.000Z"
    }
  ],
  "count": 2
}
```

**Vazio:**
```json
{
  "ok": true,
  "orders": [],
  "count": 0
}
```

---

### agent_get_order_status

**Pedido em montagem:**
```json
{
  "ok": true,
  "order": {
    "order_id": "9da3c1eb-7eaf-4484-99d2-654f6bf0c1be",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "2024-03-28T14:20:00.000Z",
    "product_name": "PED-2024-001"
  }
}
```

**Pedido entregue:**
```json
{
  "ok": true,
  "order": {
    "order_id": "37082245-537f-4ffb-b057-2406a5bd93c1",
    "status": "delivered",
    "label": "Entregue",
    "updated_at": "2024-03-28T10:00:00.000Z",
    "product_name": "PED-2024-002"
  }
}
```

---

### agent_get_assemblers

```json
{
  "ok": true,
  "assemblers": [
    {
      "id": "inst-001",
      "name": "Carlos Oliveira",
      "phone": "11988887777",
      "city": "São Paulo",
      "bio": "Especialista em montagem de painéis solares com 10 anos de experiência",
      "photo_url": "https://storage.exemplo.com/montadores/carlos.jpg"
    },
    {
      "id": "inst-002",
      "name": "Ana Souza",
      "phone": "11977776666",
      "city": "São Paulo",
      "bio": "Montadora certificada com expertise em instalações residenciais",
      "photo_url": null
    }
  ],
  "count": 2
}
```

---

### agent_create_lead

```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "lead-001",
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "whatsapp",
    "status": "new_interest",
    "created_at": "2024-03-28T12:00:00.000Z"
  }
}
```

---

### agent_update_lead_status

```json
{
  "ok": true,
  "message": "Lead status updated successfully",
  "lead_id": "lead-001",
  "old_status": "new_interest",
  "new_status": "talking_human"
}
```

---

### agent_add_lead_note

```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "lead-001",
  "note": {
    "id": "note-001",
    "message": "Cliente solicitou orçamento para instalação de 3kWp",
    "created_at": "2024-03-28T12:05:00.000Z"
  }
}
```

---

## Exemplos de Response - Erro

### Token Ausente

```json
{
  "ok": false,
  "error": "Missing x-agent-token header"
}
```

---

### Token Inválido

```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

---

### Permissões Insuficientes

```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

---

### Parâmetro Obrigatório Ausente - phone

```json
{
  "ok": false,
  "error": "Missing required parameter: phone"
}
```

---

### Parâmetro Obrigatório Ausente - order_id

```json
{
  "ok": false,
  "error": "Missing required parameter: order_id"
}
```

---

### Parâmetro Obrigatório Ausente - lead_id

```json
{
  "ok": false,
  "error": "Missing required field: lead_id"
}
```

---

### Parâmetro Obrigatório Ausente - status

```json
{
  "ok": false,
  "error": "Missing required field: status"
}
```

---

### Parâmetro Obrigatório Ausente - message

```json
{
  "ok": false,
  "error": "Missing required field: message"
}
```

---

### Order Not Found

```json
{
  "ok": false,
  "error": "Order not found"
}
```

---

### Lead Not Found

```json
{
  "ok": false,
  "error": "Lead not found"
}
```

---

### Product Not Found

```json
{
  "ok": false,
  "error": "Product not found"
}
```

---

### Erro Interno

```json
{
  "ok": false,
  "error": "Internal server error"
}
```

---

## Comandos cURL Prontos

### Buscar Produtos

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?q=solar&limit=10" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI"
```

---

### Produto por ID

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_product_by_id?id=PRODUTO_UUID" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI"
```

---

### Buscar Pedidos por Telefone

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI"
```

---

### Status do Pedido

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=ORDER_UUID" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI"
```

---

### Lista de Montadores

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_assemblers?city=São+Paulo&limit=10" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI"
```

---

### Criar Lead

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI" \
  -d '{
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "whatsapp",
    "status": "new_interest",
    "notes": "Cliente interessado em sistema solar"
  }'
```

---

### Atualizar Status do Lead

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_update_lead_status" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI" \
  -d '{
    "lead_id": "LEAD_UUID",
    "status": "talking_human"
  }'
```

---

### Adicionar Nota ao Lead

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_lead_note" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: SEU_TOKEN_HASH_AQUI" \
  -d '{
    "lead_id": "LEAD_UUID",
    "message": "Cliente solicitou orçamento"
  }'
```

---

## Substituir Marcadores

Nos comandos acima, substitua:

- `SEU_TOKEN_HASH_AQUI` → Seu token hash real
- `PRODUTO_UUID` → UUID do produto
- `ORDER_UUID` → UUID do pedido
- `LEAD_UUID` → UUID do lead

---

**Pronto para copiar e usar!** 📋
