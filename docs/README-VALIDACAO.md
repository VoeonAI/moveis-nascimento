# Validação de Endpoints - Integração IA via n8n

📋 **Objetivo:** Validar manualmente todos os endpoints da integração IA sem alterar o frontend ou o canal WhatsApp.

✅ **Status:** Todos os endpoints implementados e prontos para validação.

---

## 📁 Documentos Disponíveis

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[Documentação Completa](./validacao-endpoints-ia.md)** | Documentação detalhada de todos os endpoints | Para entender profundamente cada endpoint |
| **[Checklist Compacto](./checklist-validacao-n8n.md)** | Checklist rápido para testes manuais | Para validação rápida no n8n |
| **[Payloads JSON](./payloads-exemplo.json)** | Exemplos de payloads prontos | Para copiar e colar nos testes |
| **[Guia n8n](./guia-n8n-node-config.md)** | Como configurar nós HTTP no n8n | Para criar workflows de teste |

---

## 🚀 Quick Start

### 1. Preparação (5 minutos)

```sql
-- Criar token de teste no Supabase
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token Teste IA',
  'seu_token_hash_aqui',  -- Gere um hash SHA-256 de um token
  ARRAY['leads:read', 'leads:write', 'leads:update', 'products:read'],
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
  "PRODUCT_ID": "uuid-do-produto"
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

### 5 Endpoints Solicitados

| # | Endpoint | Método | Status |
|---|----------|--------|--------|
| 1 | `agent_create_lead` | POST | ✅ Implementado |
| 2 | `agent_update_lead_status` | POST | ✅ Implementado |
| 3 | `agent_add_lead_note` | POST | ✅ Implementado |
| 4 | `agent_get_order_status` | GET | ✅ Implementado |
| 5 | `agent_get_assemblers` | GET | ✅ Implementado |

### 2 Endpoints Bônus (Já existiam)

| # | Endpoint | Método | Status |
|---|----------|--------|--------|
| 6 | `agent_products_search` | GET | ✅ Disponível |
| 7 | `agent_product_by_id` | GET | ✅ Disponível |

---

## 🔐 Autenticação

Todos os endpoints usam autenticação via header:

```
x-agent-token: {TOKEN_HASH}
```

### Scopes Necessários

| Scope | Descrição |
|-------|-----------|
| `leads:read` | Ler leads e oportunidades |
| `leads:write` | Criar e modificar leads |
| `leads:update` | Atualizar status de leads |
| `products:read` | Ler produtos públicos |
| `products:read_private` | Ler preços e dados privados |

---

## ✅ Fluxo de Validação Sugerido

### Fase 1: Setup (10 min)
1. ✅ Ler [Guia n8n](./guia-n8n-node-config.md)
2. ✅ Criar token de teste no banco
3. ✅ Configurar variáveis no n8n
4. ✅ Ter dados de teste no banco (lead, pedido, produto)

### Fase 2: Testes de Sucesso (20 min)
1. ✅ Criar lead (anotar `lead_id`)
2. ✅ Atualizar status do lead
3. ✅ Adicionar nota ao lead
4. ✅ Buscar status do pedido
5. ✅ Buscar montadores ativos
6. ✅ Buscar produtos
7. ✅ Buscar produto por ID

### Fase 3: Testes de Erro (15 min)
Para cada endpoint, testar:
- ❌ Sem token
- ❌ Token inválido
- ❌ Sem permissão
- ❌ Parâmetros faltando
- ❌ ID inexistente

### Fase 4: Validação Banco (10 min)
- ✅ Conferir tabela `leads` após cada operação
- ✅ Conferir tabela `lead_timeline` após cada operação
- ✅ Conferir tabela `orders` ao buscar status
- ✅ Conferir tabela `installers` ao buscar montadores

**Tempo total estimado:** ~55 minutos

---

## 📖 Como Usar os Documentos

### Para Validação Rápida
Use o **[Checklist Compacto](./checklist-validacao-n8n.md)** - lista direta dos testes a executar.

### Para Entendimento Profundo
Leia **[Documentação Completa](./validacao-endpoints-ia.md)** - detalhes de cada endpoint, exemplos e validações.

### Para Configurar n8n
Consulte **[Guia n8n](./guia-n8n-node-config.md)** - passo a passo para configurar nós HTTP Request.

### Para Payloads Prontos
Copie de **[payloads-exemplo.json](./payloads-exemplo.json)** - JSONs formatados para cada endpoint.

---

## 🎯 Resultados Esperados

### Testes de Sucesso
- ✅ Todos os endpoints retornam `{ ok: true }`
- ✅ Campos esperados estão presentes na resposta
- ✅ Dados são salvos corretamente no banco
- ✅ Timeline de leads é atualizada automaticamente

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
-- Ao buscar status do pedido
SELECT * FROM orders WHERE id = 'uuid';
```

### tabela: `installers`
```sql
-- Ao buscar montadores
SELECT * FROM installers WHERE active = true;
```

---

## 📝 Checklist Final de Validação

### Antes de Começar
- [ ] Token de agente criado no banco
- [ ] Token com scopes necessários
- [ ] Token hash obtido
- [ ] Dados de teste no banco (order, product, installer)
- [ ] n8n configurado com variáveis

### Testes de Sucesso
- [ ] ✅ Criar lead com sucesso
- [ ] ✅ Atualizar status do lead
- [ ] ✅ Adicionar nota ao lead
- [ ] ✅ Buscar status do pedido
- [ ] ✅ Buscar montadores ativos
- [ ] ✅ Buscar produtos
- [ ] ✅ Buscar produto por ID

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

---

## 📞 Problemas?

### Comum: "Missing x-agent-token header"
- Soluções no [Guia n8n](./guia-n8n-node-config.md#troubleshooting-comum)

### Comum: "Invalid or inactive token"
- Soluções no [Guia n8n](./guia-n8n-node-config.md#troubleshooting-comum)

### Comum: "Insufficient permissions"
- Adicione scopes necessários ao token no banco

---

## 📈 Status Final

```
✅ Todos os 5 endpoints solicitados implementados
✅ 2 endpoints bônus disponíveis
✅ Documentação completa
✅ Payloads de exemplo
✅ Guia de configuração n8n
✅ Checklist de validação

🎯 Pronto para validação manual!
```

---

## 📚 Referências

- **URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`
- **Project ID:** `kbpkdnptzvsvoujirfwe`
- **Tabela de tokens:** `agent_tokens`
- **Campo de token:** `token_hash`

---

**Comece aqui:** [Checklist Compacto](./checklist-validacao-n8n.md) 👈
