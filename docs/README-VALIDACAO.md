# Validação de Endpoints - Integração IA via n8n

📋 **Objetivo:** Validar manualmente todos os endpoints da integração IA sem alterar o frontend ou o canal WhatsApp.

✅ **Status:** Todos os endpoints implementados e prontos para validação.

---

## 📁 Documentos Disponíveis

### Validação de Leads, Produtos e Pedidos
| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[Validação Completa](./validacao-endpoints-ia.md)** | Documentação detalhada de leads, produtos e pedidos | Para entender profundamente cada endpoint |
| **[Checklist Compacto](./checklist-validacao-n8n.md)** | Checklist rápido para testes manuais | Para validação rápida no n8n |
| **[Payloads JSON](./payloads-exemplo.json)** | Exemplos de payloads prontos | Para copiar e colar nos testes |
| **[Guia n8n](./guia-n8n-node-config.md)** | Como configurar nós HTTP no n8n | Para criar workflows de teste |

### Validação de Rastreio de Pedidos
| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[Rastreio de Pedidos](./README-RASTREIO.md)** | Guia principal de rastreio de pedidos | Para acessar docs específicos de rastreio |
| **[Validação Rastreio](./validacao-rastreio-pedidos.md)** | Documentação detalhada de rastreio | Para entender profundamente os endpoints de rastreio |
| **[Payloads Rastreio](./payloads-rastreio-pedidos.json)** | Payloads prontos para rastreio | Para testes de rastreio |
| **[Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)** | Configuração n8n para rastreio | Para workflows de rastreio |

---

## 🚀 Quick Start

### 1. Preparação (5 minutos)

```sql
-- Criar token de teste com todos os scopes necessários
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token Teste IA Completo',
  'seu_token_hash_aqui',  -- Gere um hash SHA-256 de um token
  ARRAY['leads:read', 'leads:write', 'leads:update', 'products:read', 'orders:read'],
  true
);
RETURNING id, name, token_hash, scopes;
```

### 2. Configuração no n8n (5 minutos)

Crie um nó "Set" com variáveis:
```json
{
  "TOKEN_HASH": "seu_token_hash_aqui",
  "ORDER_ID": "uuid-do-pedido",
  "PRODUCT_ID": "uuid-do-produto",
  "TEST_PHONE": "5511999999999"
}
```

### 3. Primeiro Teste (2 minutos)

Use o payload do documento **[payloads-exemplo.json](./payloads-exemplo.json)** para criar um lead:

```bash
POST https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead
Headers: { "x-agent-token": "seu_token_hash" }
Body: { "name": "Teste", "phone": "11999999999" }
```

---

## 📊 Endpoints Implementados

### Gerenciamento de Leads (5 endpoints)
| # | Endpoint | Método | Scope | Status |
|---|----------|--------|-------|--------|
| 1 | `agent_create_lead` | POST | `leads:write` | ✅ Implementado |
| 2 | `agent_update_lead_status` | POST | `leads:update` | ✅ Implementado |
| 3 | `agent_add_lead_note` | POST | `leads:write` | ✅ Implementado |
| 4 | `agent_products_search` | GET | `products:read` | ✅ Disponível |
| 5 | `agent_product_by_id` | GET | `products:read` | ✅ Disponível |

### Rastreio de Pedidos (2 endpoints)
| # | Endpoint | Método | Scope | Status |
|---|----------|--------|-------|--------|
| 6 | `agent_find_recent_orders_by_phone` | GET | `orders:read` | ✅ Novo |
| 7 | `agent_get_order_status` | GET | `orders:read` | ✅ Atualizado |

### Outros (1 endpoint)
| # | Endpoint | Método | Scope | Status |
|---|----------|--------|-------|--------|
| 8 | `agent_get_assemblers` | GET | `leads:read` ou `products:read` | ✅ Implementado |

**Total:** 8 endpoints implementados

---

## 🔐 Autenticação

Todos os endpoints usam autenticação via header:

```
x-agent-token: {TOKEN_HASH}
```

### Scopes Necessários

| Scope | Descrição | Endpoints |
|-------|-----------|-----------|
| `leads:read` | Ler leads e oportunidades | Buscar montadores |
| `leads:write` | Criar e modificar leads | Criar lead, Adicionar nota |
| `leads:update` | Atualizar status de leads | Atualizar status |
| `products:read` | Ler produtos públicos | Buscar produtos, Buscar montadores |
| `orders:read` | Ler pedidos | Buscar pedidos por telefone, Status do pedido |
| `products:read_private` | Ler preços e dados privados | Produto por ID (opcional) |

---

## ✅ Fluxo de Validação Sugerido

### Fase 1: Setup (10 min)
1. ✅ Ler [Guia n8n](./guia-n8n-node-config.md) ou [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)
2. ✅ Criar token de teste no banco
3. ✅ Configurar variáveis no n8n
4. ✅ Ter dados de teste no banco (lead, pedido, produto, montador)

### Fase 2: Testes de Sucesso - Leads (20 min)
1. ✅ Criar lead (anotar `lead_id`)
2. ✅ Atualizar status do lead
3. ✅ Adicionar nota ao lead
4. ✅ Buscar montadores ativos
5. ✅ Buscar produtos
6. ✅ Buscar produto por ID

### Fase 3: Testes de Sucesso - Rastreio de Pedidos (15 min)
1. ✅ Buscar pedidos por telefone (vários formatos)
2. ✅ Validar normalização de telefone
3. ✅ Buscar status de pedido específico
4. ✅ Validar período de 90 dias

### Fase 4: Testes de Erro (15 min)
Para cada endpoint, testar:
- ❌ Sem token
- ❌ Token inválido
- ❌ Sem permissão
- ❌ Parâmetros faltando
- ❌ ID inexistente

### Fase 5: Validação Banco (10 min)
- ✅ Conferir tabela `leads` após cada operação
- ✅ Conferir tabela `lead_timeline` após cada operação
- ✅ Conferir tabela `orders` ao buscar status
- ✅ Conferir tabela `installers` ao buscar montadores
- ✅ Conferir tabela `products` ao buscar produtos

**Tempo total estimado:** ~70 minutos

---

## 📖 Como Usar os Documentos

### Para Validação de Leads/Produtos
Use o **[Checklist Compacto](./checklist-validacao-n8n.md)** - lista direta dos testes a executar.

### Para Validação de Rastreio de Pedidos
Use o **[Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)** - passo a passo específico para rastreio.

### Para Entendimento Profundo
Leia **[Documentação Completa](./validacao-endpoints-ia.md)** ou **[Validação Rastreio](./validacao-rastreio-pedidos.md)**.

### Para Configurar n8n
- **Geral:** [Guia n8n](./guia-n8n-node-config.md)
- **Rastreio:** [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)

### Para Payloads Prontos
- **Geral:** [Payloads JSON](./payloads-exemplo.json)
- **Rastreio:** [Payloads Rastreio](./payloads-rastreio-pedidos.json)

---

## 🎯 Resumo por Categoria

### 📝 Gerenciamento de Leads
**Documentação:** [validacao-endpoints-ia.md](./validacao-endpoints-ia.md)

1. **Criar Lead** - `agent_create_lead` (POST)
   - Cria novo lead no sistema
   - Cria automaticamente entrada em `lead_timeline`

2. **Atualizar Status do Lead** - `agent_update_lead_status` (POST)
   - Altera status do lead
   - Registra mudança na timeline

3. **Adicionar Nota ao Lead** - `agent_add_lead_note` (POST)
   - Adiciona nota/observação ao lead
   - Registra na timeline

### 📦 Consulta de Produtos
**Documentação:** [validacao-endpoints-ia.md](./validacao-endpoints-ia.md)

4. **Buscar Produtos** - `agent_products_search` (GET)
   - Busca produtos por termo, categoria
   - Retorna produtos públicos

5. **Produto por ID** - `agent_product_by_id` (GET)
   - Detalhes de um produto específico
   - Dados privados se tiver scope `products:read_private`

### 🚚 Rastreio de Pedidos
**Documentação:** [README-RASTREIO.md](./README-RASTREIO.md)

6. **Buscar Pedidos por Telefone** - `agent_find_recent_orders_by_phone` (GET)
   - Busca pedidos dos últimos 90 dias
   - Normaliza telefone automaticamente
   - Ordena do mais recente para o mais antigo

7. **Status do Pedido** - `agent_get_order_status` (GET)
   - Status técnico e label amigável
   - Usa tabela `orders` como fonte principal
   - Não depende de opportunities

### 👷 Consulta de Montadores
**Documentação:** [validacao-endpoints-ia.md](./validacao-endpoints-ia.md)

8. **Buscar Montadores** - `agent_get_assemblers` (GET)
   - Lista montadores ativos
   - Filtro opcional por cidade

---

## 🎯 Resultados Esperados

### Testes de Sucesso
- ✅ Todos os endpoints retornam `{ ok: true }`
- ✅ Campos esperados estão presentes na resposta
- ✅ Dados são salvos corretamente no banco
- ✅ Timeline de leads é atualizada automaticamente
- ✅ Telefone é normalizado corretamente (rastreio)
- ✅ Apenas pedidos dos últimos 90 dias (rastreio)

### Testes de Erro
- ✅ Todos os endpoints retornam `{ ok: false }` com erro específico
- ✅ Mensagens de erro são claras
- ✅ Nenhum dado é criado/alterado em erro

---

## 🔍 Validação por Tabela

### tabela: `leads`
```sql
-- Após criar lead
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;

-- Após atualizar status
SELECT id, name, status FROM leads WHERE id = 'uuid';

-- Após adicionar nota
SELECT id, name, last_activity_at FROM leads WHERE id = 'uuid';
```

### tabela: `lead_timeline`
```sql
-- Após qualquer operação em lead
SELECT * FROM lead_timeline 
WHERE lead_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 1;
```

### tabela: `orders`
```sql
-- Ao buscar pedidos por telefone
SELECT * FROM orders 
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;

-- Ao buscar status
SELECT * FROM orders WHERE id = 'uuid';
```

### tabela: `installers`
```sql
-- Ao buscar montadores
SELECT * FROM installers WHERE active = true;
```

### tabela: `products`
```sql
-- Ao buscar produtos
SELECT * FROM products WHERE active = true LIMIT 10;

-- Ao buscar produto por ID
SELECT * FROM products WHERE id = 'uuid';
```

---

## 📝 Checklist Final de Validação

### Antes de Começar
- [ ] Token de agente criado no banco
- [ ] Token com scopes necessários
- [ ] Token hash obtido
- [ ] Dados de teste no banco (lead, order, product, installer)
- [ ] n8n configurado com variáveis

### Testes de Sucesso - Leads
- [ ] ✅ Criar lead com sucesso
- [ ] ✅ Atualizar status do lead
- [ ] ✅ Adicionar nota ao lead
- [ ] ✅ Buscar montadores ativos
- [ ] ✅ Buscar produtos
- [ ] ✅ Buscar produto por ID

### Testes de Sucesso - Rastreio
- [ ] ✅ Buscar pedidos por telefone
- [ ] ✅ Normalizar telefone (vários formatos)
- [ ] ✅ Validar período de 90 dias
- [ ] ✅ Buscar status do pedido
- [ ] ✅ Validar status e label

### Testes de Erro
- [ ] ❌ Sem token (todos os endpoints)
- [ ] ❌ Token inválido (todos os endpoints)
- [ ] ❌ Sem permissão (todos os endpoints)
- [ ] ❌ Parâmetros faltando (todos os endpoints)
- [ ] ❌ ID inexistente (quando aplicável)

### Validação no Banco
- [ ] Tabela `leads` atualizada corretamente
- [ ] Tabela `lead_timeline` com eventos corretos
- [ ] Tabela `orders` com dados corretos
- [ ] Tabela `installers` com dados corretos
- [ ] Tabela `products` com dados corretos

### Documentação
- [ ] Resultados documentados
- [ ] Issues registradas (se houver)
- [ ] Tempo de resposta anotado
- [ ] Comportamentos inesperados registrados

---

## 🚨 Observações Importantes

1. **Sempre HTTP 200:** Mesmo em erros, endpoints retornam status 200. Veja o campo `ok`.
2. **Token Hash:** Use sempre o `token_hash`, não o token em texto.
3. **Timeline:** Operações em lead criam automaticamente eventos em `lead_timeline`.
4. **Last Activity:** Operações em lead atualizam `last_activity_at`.
5. **Scopes:** Verifique os scopes antes de testar cada endpoint.
6. **Normalização de Telefone:** Rastreio normaliza telefone automaticamente para E.164.
7. **Período de 90 Dias:** Rastreio apenas retorna pedidos recentes.

---

## 📞 Problemas?

### Comum: "Missing x-agent-token header"
- Soluções no [Guia n8n](./guia-n8n-node-config.md#troubleshooting-comum)
- Soluções no [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md#troubleshooting)

### Comum: "Invalid or inactive token"
- Soluções no [Guia n8n](./guia-n8n-node-config.md#troubleshooting-comum)
- Soluções no [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md#troubleshooting)

### Comum: "Insufficient permissions"
- Adicione scopes necessários ao token no banco

---

## 📈 Status Final

```
✅ 8 endpoints implementados
   - 5 de gerenciamento de leads/produtos
   - 2 de rastreio de pedidos
   - 1 de consulta de montadores

✅ Documentação completa (4 documentos)
✅ Payloads de exemplo (2 arquivos JSON)
✅ Guia de configuração n8n (2 guias)
✅ Checklist de validação
✅ Contratos de resposta definidos
✅ Normalização de telefone implementada
✅ Filtro de 90 dias implementado

🎯 Pronto para validação manual!
```

---

## 📚 Referências

- **URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`
- **Project ID:** `kbpkdnptzvsvoujirfwe`
- **Tabela de tokens:** `agent_tokens`
- **Campo de token:** `token_hash`

---

## 🔗 Links por Categoria

### 📝 Leads e Produtos
- [Documentação Completa](./validacao-endpoints-ia.md)
- [Checklist Compacto](./checklist-validacao-n8n.md)
- [Payloads Gerais](./payloads-exemplo.json)
- [Guia n8n Geral](./guia-n8n-node-config.md)

### 🚚 Rastreio de Pedidos
- [Guia Principal Rastreio](./README-RASTREIO.md)
- [Validação Rastreio](./validacao-rastreio-pedidos.md)
- [Payloads Rastreio](./payloads-rastreio-pedidos.json)
- [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)

---

**Comece aqui:**

- **Para Leads/Produtos:** [Checklist Compacto](./checklist-validacao-n8n.md) 👈
- **Para Rastreio:** [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md) 👈