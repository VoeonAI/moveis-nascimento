# Organização de Funções de Agente por Domínio

## Visão Geral

Este documento organiza todas as edge functions de agente por domínio de negócio, identificando escopos de permissão e status de uso.

**Data:** 2025-01-06  
**Objetivo:** Preparar base para expansão controlada de CRM

---

## Domínios

### 1. CATALOG 📦 (READ ONLY)

Funções de leitura do catálogo de produtos.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `agent_product_by_id` | `products:read` | GET | ✅ Ativo |
| `agent_products_search` | `products:read` | GET | ✅ Ativo |

**Uso Atual:** IA consulta detalhes de produtos e busca por nome/categoria.

---

### 2. ORDERS 📋 (READ ONLY)

Funções de leitura de pedidos e status.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `agent_find_recent_orders_by_phone` | `orders:read` | GET | ✅ Ativo |
| `agent_get_order_status` | `orders:read` | GET | ✅ Ativo |

**Uso Atual:** IA consulta histórico de pedidos e status atual de entrega.

---

### 3. CRM 🤝 (READ + WRITE)

Funções de gerenciamento de leads e relacionamento com clientes.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `agent_create_lead_interest` | `leads:write` | POST | ✅ **ATIVO (ÚNICA)** |
| `agent_add_lead_note` | `leads:write` | POST | ⚠️ Legado - Não utilizado |
| `agent_create_lead` | `leads:write` | POST | ⚠️ Legado - Não utilizado |
| `agent_update_lead_status` | `leads:update` | PUT | ⚠️ Legado - Não utilizado |

**⚠️ IMPORTANTE:**
- **`agent_create_lead_interest` é a ÚNICA função WRITE ativa no CRM**
- Funções legadas (`agent_add_lead_note`, `agent_create_lead`, `agent_update_lead_status`) existem mas NÃO são usadas pelo fluxo atual de IA
- Futuras expansões devem seguir o padrão estabelecido por `agent_create_lead_interest`

**Uso Atual:** IA registra interesse de atendimento (somente quando há intenção comercial explícita).

---

### 4. INSTALLERS 🔧 (READ ONLY)

Funções de consulta de montadores parceiros.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `agent_get_assemblers` | `leads:read` OU `products:read` | GET | ✅ Ativo |

**Uso Atual:** IA consulta montadores disponíveis por cidade.

---

### 5. SETTINGS ⚙️

Funções de configuração do sistema.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| (não identificado ainda) | - | - | 🚧 Pendente |

---

### 6. ADMIN 👑

Funções administrativas (gerenciamento de usuários, tokens, etc.).

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `admin_set_user_role` | `admin:write` | POST | ✅ Ativo |
| `admin_create_user` | `admin:write` | POST | ✅ Ativo |
| `admin_hard_delete` | `admin:write` | DELETE | ✅ Ativo |

**Uso Atual:** Gestão administrativa do sistema (não acessível pela IA).

---

### 7. SYSTEM / OTHER 🔄

Funções de sistema ou uso específico.

| Função | Escopo Necessário | Método | Status |
|--------|-------------------|--------|--------|
| `interest_create` | - | POST | ⚠️ Legado - Não utilizado |
| `webhooks_dispatch` | - | POST | ✅ Ativo |

---

## Padrão de Autenticação (Consistente)

Todas as funções `agent_*` seguem o mesmo padrão de autenticação:

### 1. Headers
```
x-agent-token: <token_hash>
content-type: application/json
```

### 2. Fluxo de Validação
1. Extrair `x-agent-token` do header
2. Consultar tabela `agent_tokens` com:
   - `token_hash` = valor recebido
   - `active` = true
3. Verificar se token possui escopo necessário (ex: `leads:write`)
4. Atualizar `last_used_at` do token
5. Executar lógica da função

### 3. CORS Padrão
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-agent-token, content-type',
}
```

### 4. Resposta Padrão (Sucesso)
```typescript
{
  ok: true,
  // ... campos específicos da função
}
```

### 5. Resposta Padrão (Erro)
```typescript
{
  ok: false,
  error: "mensagem de erro"
}
```

### 6. Logs
- Todos os logs são prefixados com `[nome_funcao]`
- Formato: `[nome_funcao] mensagem`, `[nome_funcao] error: ...`

---

## Escopos de Permissão

| Escopo | Descrição | Funções que Usam |
|--------|-----------|------------------|
| `products:read` | Leitura de produtos | `agent_product_by_id`, `agent_products_search` |
| `orders:read` | Leitura de pedidos | `agent_find_recent_orders_by_phone`, `agent_get_order_status` |
| `leads:read` | Leitura de leads | `agent_get_assemblers` (qualquer read aceito) |
| `leads:write` | Criação/escrita em leads | `agent_create_lead_interest` (única ativa) |
| `leads:update` | Atualização de status de leads | `agent_update_lead_status` (legado) |
| `admin:write` | Operações administrativas | `admin_set_user_role`, `admin_create_user`, `admin_hard_delete` |

---

## Status de Funções

- ✅ **Ativo:** Em uso atual pela IA ou sistema
- ⚠️ **Legado:** Existe mas não é utilizado no fluxo atual
- 🚧 **Pendente:** Planejado mas não implementado ainda

---

## Próximos Passos para Expansão de CRM

1. **Manter `agent_create_lead_interest` como única função WRITE ativa**
2. **Estudar funções legadas** (`agent_add_lead_note`, `agent_create_lead`, `agent_update_lead_status`) antes de reutilizá-las
3. **Seguir padrão de autenticação estabelecido** para novas funções
4. **Documentar contrato antes de implementar** (ex: `crm.addTimelineNote`)
5. **Criar funções com nomes semânticos** por domínio (ex: `crm_add_timeline_note` em vez de `agent_something`)

---

## Convenções de Nomenclatura

### Prefixos por Tipo
- `agent_*` - Funções acessíveis por agentes de IA
- `admin_*` - Funções administrativas
- `webhooks_*` - Webhooks de sistema

### Formato de Nomes
- Domínio + ação + entidade: `agent_find_recent_orders_by_phone`
- Verbo + entidade: `agent_create_lead_interest`

---

**Versão:** 1.0  
**Última Atualização:** 2025-01-06
