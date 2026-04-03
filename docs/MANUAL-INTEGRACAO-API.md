# Manual de Integração - API de Agentes IA

**Versão:** 2.0  
**Data:** 2024-03-28  
**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Scopes](#scopes)
4. [Tratamento de Erros](#tratamento-de-erros)
5. [Endpoints de Leitura](#endpoints-de-leitura)
6. [Endpoints de Escrita](#endpoints-de-escrita)
7. [Observações de Negócio](#observações-de-negócio)
8. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

Esta API fornece endpoints para integração de agentes de IA com o sistema, permitindo:

- **Consulta de produtos**: Busca de produtos por termo, categoria ou ID
- **Rastreio de pedidos**: Consulta de pedidos por telefone e status
- **Gestão de leads**: Criação, atualização e notas de leads
- **Consulta de montadores**: Lista de montadores ativos

### Endpoints Disponíveis

**Total:** 8 endpoints

| Categoria | Quantidade | Endpoints |
|-----------|-------------|------------|
| Produtos | 2 | `agent_products_search`, `agent_product_by_id` |
| Pedidos | 2 | `agent_find_recent_orders_by_phone`, `agent_get_order_status` |
| Leads | 3 | `agent_create_lead`, `agent_update_lead_status`, `agent_add_lead_note` |
| Montadores | 1 | `agent_get_assemblers` |

---

## Autenticação

Todos os endpoints requerem autenticação via header HTTP.

### Header de Autenticação

```
x-agent-token: {TOKEN_HASH}
```

**Exemplo:**
```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

### Como Obter um Token

Tokens são criados na tabela `agent_tokens` do banco de dados:

```sql
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token IA Produção',
  'seu_token_hash_aqui',  -- Gere um hash SHA-256
  ARRAY['products:read', 'orders:read'],
  true
);
```

### Validação do Token

Para cada requisição, o sistema valida:
1. ✅ Token existe na tabela `agent_tokens`
2. ✅ `token_hash` corresponde ao valor enviado
3. ✅ Token está ativo (`active = true`)
4. ✅ Token possui o scope necessário para o endpoint

---

## Scopes

Scopes determinam as permissões de um token. Cada endpoint requer scopes específicos.

### Lista de Scopes

| Scope | Descrição | Endpoints |
|-------|-----------|-----------|
| `leads:read` | Ler leads e oportunidades | `agent_get_assemblers` |
| `leads:write` | Criar e modificar leads | `agent_create_lead`, `agent_add_lead_note` |
| `leads:update` | Atualizar status de leads | `agent_update_lead_status` |
| `products:read` | Ler produtos públicos | `agent_products_search`, `agent_product_by_id`, `agent_get_assemblers` |
| `products:read_private` | Ler dados privados de produtos | `agent_product_by_id` (opcional) |
| `orders:read` | Ler pedidos | `agent_find_recent_orders_by_phone`, `agent_get_order_status` |

### Combinações de Scopes Comuns

**Para Produtos:**
```sql
ARRAY['products:read']
```

**Para Rastreio:**
```sql
ARRAY['orders:read']
```

**Para Gestão de Leads:**
```sql
ARRAY['leads:read', 'leads:write', 'leads:update']
```

**Para Acesso Completo:**
```sql
ARRAY['leads:read', 'leads:write', 'leads:update', 'products:read', 'orders:read']
```

---

## Tratamento de Erros

Todos os endpoints seguem um padrão consistente de resposta de erro.

### Padrão de Resposta de Erro

**Status HTTP:** `200` (sempre, mesmo em erro)

**Body JSON:**
```json
{
  "ok": false,
  "error": "Mensagem de erro específica"
}
```

### Tipos de Erro

#### 1. Token Ausente
```json
{
  "ok": false,
  "error": "Missing x-agent-token header"
}
```

**Causa:** Header `x-agent-token` não foi enviado.

#### 2. Token Inválido
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

**Causa:** Token não existe no banco ou está inativo (`active = false`).

#### 3. Permissões Insuficientes
```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

**Causa:** Token não possui o scope necessário para o endpoint.

#### 4. Parâmetro Obrigatório Ausente
```json
{
  "ok": false,
  "error": "Missing required parameter: {param_name}"
}
```

**Causa:** Parâmetro obrigatório não foi enviado (query param ou body field).

#### 5. Recurso Não Encontrado
```json
{
  "ok": false,
  "error": "{resource} not found"
}
```

**Causa:** ID informado não existe no banco.

**Exemplos:**
- `Order not found`
- `Lead not found`
- `Product not found`

#### 6. Erro Interno
```json
{
  "ok": false,
  "error": "Internal server error"
}
```

**Causa:** Erro inesperado no servidor.

### Validando Sucesso ou Erro

Sempre verifique o campo `ok` na resposta:

```javascript
const response = await fetch(url, options);
const data = await response.json();

if (data.ok === true) {
  // Sucesso - usar os dados
  console.log(data.orders);
} else {
  // Erro - tratar a mensagem
  console.error(data.error);
}
```

---

## Endpoints de Leitura

### 1. Buscar Produtos

**Endpoint:** `agent_products_search`  
**Método:** `GET`  
**Scope:** `products:read`

#### Descrição
Busca produtos por termo, categoria ou retorna todos os produtos ativos.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `q` | string | Não | Termo de busca (busca em nome e descrição) |
| `category` | string | Não | Slug da categoria para filtro |
| `limit` | number | Não | Limite de resultados (padrão: 10, máximo: 50) |

#### Exemplo de Request

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?q=solar&limit=5" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

#### Exemplo de Response - Sucesso

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
    }
  ],
  "count": 1
}
```

#### Exemplo de Response - Vazio

```json
{
  "ok": true,
  "products": [],
  "count": 0
}
```

---

### 2. Produto por ID

**Endpoint:** `agent_product_by_id`  
**Método:** `GET`  
**Scope:** `products:read` (+ `products:read_private` opcional)

#### Descrição
Retorna detalhes completos de um produto específico.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | UUID | Sim | ID do produto |

#### Exemplo de Request

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_product_by_id?id=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

#### Exemplo de Response - Sucesso (com dados privados)

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

#### Exemplo de Response - Sucesso (sem dados privados)

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

#### Observação Importante
O campo `private` só é preenchido se o token tiver o scope `products:read_private`. Caso contrário, o valor é `null`.

---

### 3. Buscar Pedidos por Telefone

**Endpoint:** `agent_find_recent_orders_by_phone`  
**Método:** `GET`  
**Scope:** `orders:read`

#### Descrição
Busca pedidos de um cliente através do telefone, retornando apenas pedidos dos últimos 90 dias.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `phone` | string | Sim | Telefone do cliente (qualquer formato) |

#### Regras de Negócio

- ✅ Apenas pedidos dos **últimos 90 dias** são retornados
- ✅ Pedidos ordenados do **mais recente** para o mais antigo
- ✅ Limite de **50 resultados**
- ✅ Telefone é **normalizado automaticamente** para formato E.164

#### Normalização de Telefone

O endpoint aceita qualquer formato de telefone e normaliza automaticamente:

| Entrada | Saída Normalizada |
|---------|-------------------|
| `5511999999999` | `5511999999999` |
| `11999999999` | `5511999999999` |
| `(11) 99999-9999` | `5511999999999` |
| `+55 11 99999-9999` | `5511999999999` |

#### Exemplo de Request

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

#### Exemplo de Response - Sucesso

```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "ord-001",
      "product_name": "Em Montagem",
      "created_at": "2024-03-15T10:30:00.000Z",
      "order_stage": "assembly",
      "updated_at": "2024-03-16T14:20:00.000Z"
    },
    {
      "order_id": "ord-002",
      "product_name": "Pronto para Envio",
      "created_at": "2024-03-10T09:00:00.000Z",
      "order_stage": "ready_to_ship",
      "updated_at": "2024-03-12T16:45:00.000Z"
    }
  ],
  "count": 2
}
```

#### Exemplo de Response - Vazio

```json
{
  "ok": true,
  "orders": [],
  "count": 0
}
```

---

### 4. Status do Pedido

**Endpoint:** `agent_get_order_status`  
**Método:** `GET`  
**Scope:** `orders:read`

#### Descrição
Retorna o status de um pedido específico, incluindo status técnico e label amigável.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `order_id` | UUID | Sim | ID do pedido |

#### Exemplo de Request

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=ord-001" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

#### Exemplo de Response - Sucesso

```json
{
  "ok": true,
  "order": {
    "order_id": "ord-001",
    "status": "assembly",
    "label": "Em Montagem",
    "updated_at": "2024-03-16T14:20:00.000Z",
    "product_name": "PED-2024-001"
  }
}
```

#### Status Técnicos e Labels

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

### 5. Lista de Montadores

**Endpoint:** `agent_get_assemblers`  
**Método:** `GET`  
**Scope:** `leads:read` ou `products:read`

#### Descrição
Retorna lista de montadores ativos, opcionalmente filtrada por cidade.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `city` | string | Não | Filtrar por cidade (busca parcial) |
| `limit` | number | Não | Limite de resultados (padrão: 20, máximo: 50) |

#### Exemplo de Request

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_assemblers?city=São+Paulo&limit=10" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui"
```

#### Exemplo de Response - Sucesso

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

## Endpoints de Escrita

### 6. Criar Lead

**Endpoint:** `agent_create_lead`  
**Método:** `POST`  
**Scope:** `leads:write`

#### Descrição
Cria um novo lead no sistema. Um evento é automaticamente adicionado à timeline do lead.

#### Body Fields

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do lead |
| `phone` | string | Sim | Telefone do lead |
| `channel` | string | Não | Canal de origem (padrão: "site") |
| `status` | string | Não | Status inicial (padrão: "new_interest") |
| `notes` | string | Não | Observações adicionais |

#### Valores Possíveis

**Channel:**
- `site` (padrão)
- `whatsapp`
- `instagram`
- `facebook`
- `google`

**Status:**
- `new_interest` (padrão)
- `talking_ai`
- `talking_human`
- `proposal_sent`
- `won`
- `lost`

#### Exemplo de Request

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui" \
  -d '{
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "site",
    "status": "new_interest",
    "notes": "Cliente demonstrou interesse no produto X"
  }'
```

#### Exemplo de Response - Sucesso

```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "lead-001",
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "site",
    "status": "new_interest",
    "created_at": "2024-03-28T12:00:00.000Z"
  }
}
```

---

### 7. Atualizar Status do Lead

**Endpoint:** `agent_update_lead_status`  
**Método:** `POST`  
**Scope:** `leads:update`

#### Descrição
Atualiza o status de um lead existente. Um evento é adicionado à timeline registrando a mudança.

#### Body Fields

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lead_id` | UUID | Sim | ID do lead |
| `status` | string | Sim | Novo status |

#### Valores Possíveis de Status

| Status | Descrição |
|--------|-----------|
| `new_interest` | Novo Interesse |
| `talking_ai` | Falando com IA |
| `talking_human` | Falando com Humano |
| `proposal_sent` | Proposta Enviada |
| `won` | Ganho |
| `lost` | Perdido |

#### Exemplo de Request

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_update_lead_status" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui" \
  -d '{
    "lead_id": "lead-001",
    "status": "talking_human"
  }'
```

#### Exemplo de Response - Sucesso

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

### 8. Adicionar Nota ao Lead

**Endpoint:** `agent_add_lead_note`  
**Método:** `POST`  
**Scope:** `leads:write`

#### Descrição
Adiciona uma nota/observação ao lead. A nota é registrada na timeline do lead.

#### Body Fields

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lead_id` | UUID | Sim | ID do lead |
| `message` | string | Sim | Conteúdo da nota |

#### Exemplo de Request

```bash
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_lead_note" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash_aqui" \
  -d '{
    "lead_id": "lead-001",
    "message": "Cliente solicitou orçamento para instalação em residência"
  }'
```

#### Exemplo de Response - Sucesso

```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "lead-001",
  "note": {
    "id": "note-001",
    "message": "Cliente solicitou orçamento para instalação em residência",
    "created_at": "2024-03-28T12:05:00.000Z"
  }
}
```

---

## Observações de Negócio

### 1. Pedidos por Telefone - Janela de 90 Dias

**Endpoint afetado:** `agent_find_recent_orders_by_phone`

**Comportamento:**
- Apenas pedidos criados nos **últimos 90 dias** são retornados
- Pedidos mais antigos são automaticamente filtrados
- O cálculo é baseado no campo `created_at` do pedido

**Justificativa:**
- Mantém o foco em pedidos ativos e recentes
- Melhora performance da busca
- Reduz ruído de pedidos antigos/concluídos

**Exemplo:**
```json
// Se hoje é 2024-03-28
// Pedidos criados antes de 2023-12-28 não aparecem na busca
```

---

### 2. Status talking_ai/talking_human na Opportunity

**Contexto:**
- Os status `talking_ai` e `talking_human` são da tabela `opportunities`
- **Não** são da tabela `leads`

**Implicação:**
- Endpoints de leads usam status diferentes
- Status de lead: `new_interest`, `talking_human`, `proposal_sent`, `won`, `lost`
- Status de opportunity: `new_interest`, `talking_ai`, `talking_human`, `proposal_sent`, `won`, `lost`

**Nota:**
- `talking_ai` existe apenas em `opportunities`
- `talking_human` existe tanto em `leads` quanto em `opportunities`

---

### 3. Detalhes Privados de Produto

**Endpoint afetado:** `agent_product_by_id`

**Comportamento:**
- Dados privados (preço, estoque, etc.) só são retornados se o token tiver o scope `products:read_private`
- Sem esse scope, o campo `private` é `null`

**Dados Privados Incluem:**
- `internal_code`: Código interno do produto
- `price`: Preço do produto
- `currency`: Moeda (padrão: BRL)
- `payment_terms`: Condições de pagamento
- `notes`: Notas internas
- `dimensions`: Dimensões do produto
- `stock_status`: Status de estoque

**Exemplo:**

```json
// Com scope products:read_private
{
  "private": {
    "internal_code": "MOD-400W-001",
    "price": 1500.00,
    "stock_status": "disponivel"
  }
}

// Sem scope products:read_private
{
  "private": null
}
```

**Justificativa:**
- Protege informações sensíveis de preço e estoque
- Permite tokens de leitura pública (IA) sem acesso a dados privados
- Tokens internos podem ter acesso completo

---

### 4. Normalização de Telefone

**Endpoint afetado:** `agent_find_recent_orders_by_phone`

**Comportamento:**
- Telefone é normalizado automaticamente para formato E.164
- Qualquer formato de entrada é aceito
- Padrão E.164 para Brasil: `55` + código DDD + número

**Formatos Suportados:**

| Entrada | Saída |
|---------|-------|
| `5511999999999` | `5511999999999` |
| `11999999999` | `5511999999999` |
| `(11) 99999-9999` | `5511999999999` |
| `+55 11 99999-9999` | `5511999999999` |
| `011 9999 9999` | `5511999999999` |

**Justificativa:**
- Flexibilidade no formato de entrada
- Consistência no armazenamento
- Melhora experiência do usuário

---

### 5. Timeline Automática de Leads

**Endpoints afetados:**
- `agent_create_lead`
- `agent_update_lead_status`
- `agent_add_lead_note`

**Comportamento:**
- Qualquer operação em lead cria automaticamente um registro na tabela `lead_timeline`
- O campo `last_activity_at` do lead é atualizado automaticamente

**Eventos Criados:**

| Operação | Evento na Timeline |
|----------|---------------------|
| Criar lead | "Lead criado via IA ({token_name})" |
| Atualizar status | "Status alterado de {old} para {new}" |
| Adicionar nota | Conteúdo da mensagem |

**Justificativa:**
- Histórico completo das interações
- Rastreabilidade de mudanças
- Auditoria das ações do agente

---

### 6. product_name em Busca de Pedidos

**Endpoint afetado:** `agent_find_recent_orders_by_phone`

**Comportamento:**
- O campo `product_name` retorna o **label do estágio** do pedido
- Não retorna o nome real do produto

**Exemplo:**
```json
{
  "order_id": "ord-001",
  "product_name": "Em Montagem",  // ← Label do estágio
  "order_stage": "assembly"
}
```

**Justificativa:**
- A tabela `orders` não tem relação direta com `products`
- Contrato especificava não depender de `opportunities`
- Label do estágio é informativo para rastreio

**Nota:**
Em `agent_get_order_status`, o campo `product_name` retorna o `internal_code` do pedido.

---

## Exemplos de Uso

### Exemplo 1: Integração Completa - Rastreio de Pedido

**Cenário:** Cliente pergunta sobre status do pedido pelo WhatsApp.

```bash
# 1. Buscar pedidos do cliente
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999" \
  -H "x-agent-token: seu_token_hash"

# 2. Se encontrar pedidos, buscar detalhes do primeiro
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id={order_id}" \
  -H "x-agent-token: seu_token_hash"

# 3. Responder ao cliente com o status
# "Olá! Encontramos um pedido recente. Status atual: Em Montagem"
```

---

### Exemplo 2: Consulta de Produto com Dados Privados

**Cenário:** Sistema interno precisa de preço de produto.

```bash
# Token com scope products:read_private
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_product_by_id?id={product_id}" \
  -H "x-agent-token: token_com_scope_privado"
```

**Response inclui:**
```json
{
  "private": {
    "price": 1500.00,
    "stock_status": "disponivel"
  }
}
```

---

### Exemplo 3: Criar Lead e Adicionar Nota

**Cenário:** IA cria lead após conversa e adiciona contexto.

```bash
# 1. Criar lead
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash" \
  -d '{
    "name": "Maria Santos",
    "phone": "11988887777",
    "channel": "whatsapp",
    "status": "new_interest"
  }'

# 2. Adicionar nota com contexto da conversa
curl -X POST "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_lead_note" \
  -H "Content-Type: application/json" \
  -H "x-agent-token: seu_token_hash" \
  -d '{
    "lead_id": "lead-001",
    "message": "Cliente perguntou sobre instalação em apartamento. Interesse em sistema de 3kWp."
  }'
```

---

### Exemplo 4: Buscar Produtos por Categoria

**Cenário:** Cliente pede sugestões de painéis solares.

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search?category=modulos-solares&limit=5" \
  -H "x-agent-token: seu_token_hash"
```

---

### Exemplo 5: Encontrar Montadores por Cidade

**Cenário:** Cliente precisa de montador em São Paulo.

```bash
curl -X GET "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_assemblers?city=São+Paulo&limit=10" \
  -H "x-agent-token: seu_token_hash"
```

---

## Suporte

**Documentação Complementar:**
- [API Reference](./API-REFERENCE.md) - Referência rápida de todos os endpoints
- [Validação Rastreio](./validacao-rastreio-pedidos.md) - Validação de endpoints de rastreio

**Contato:**
Para dúvidas sobre integração, entre em contato com a equipe de desenvolvimento.

---

**Versão:** 2.0  
**Última atualização:** 2024-03-28
