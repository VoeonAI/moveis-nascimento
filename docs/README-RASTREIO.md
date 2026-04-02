# Rastreio de Pedidos IA - Documentação

📋 **Objetivo:** Implementar endpoints para rastreio de pedidos usando a tabela `orders` como fonte principal.

✅ **Status:** Implementado e pronto para validação.

---

## 📁 Documentos Disponíveis

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[Documentação Completa](./validacao-rastreio-pedidos.md)** | Documentação detalhada dos endpoints | Para entender profundamente cada endpoint |
| **[Payloads JSON](./payloads-rastreio-pedidos.json)** | Exemplos de payloads prontos | Para copiar e colar nos testes |
| **[Guia n8n](./guia-n8n-rastreio-pedidos.md)** | Como configurar nós HTTP no n8n | Para criar workflows de teste |

---

## 🚀 Quick Start

### 1. Preparação (5 minutos)

```sql
-- Criar token de teste com scope orders:read
INSERT INTO agent_tokens (name, token_hash, scopes, active)
VALUES (
  'Token Teste Rastreio',
  'seu_token_hash_aqui',  -- Gere um hash SHA-256 de um token
  ARRAY['orders:read'],
  true
);
RETURNING id, name, token_hash, scopes;
```

```sql
-- Verificar pedidos existentes (opcional)
SELECT id, customer_phone, current_stage, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Primeiro Teste (2 minutos)

**Buscar pedidos por telefone:**

```bash
GET https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_find_recent_orders_by_phone?phone=5511999999999
Headers: { "x-agent-token": "seu_token_hash" }
```

**Buscar status do pedido:**

```bash
GET https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_get_order_status?order_id=UUID_DO_PEDIDO
Headers: { "x-agent-token": "seu_token_hash" }
```

---

## 📊 Endpoints Implementados

| # | Endpoint | Método | Scope | Status |
|---|----------|--------|-------|--------|
| 1 | `agent_find_recent_orders_by_phone` | GET | `orders:read` | ✅ Novo |
| 2 | `agent_get_order_status` | GET | `orders:read` | ✅ Atualizado |

---

## 🔐 Autenticação

Todos os endpoints usam autenticação via header:

```
x-agent-token: {TOKEN_HASH}
```

### Scope Necessário

- `orders:read` - Ler pedidos

---

## 📋 Resumo dos Endpoints

### 1. Buscar Pedidos Recentes por Telefone

**URL:** `GET /functions/v1/agent_find_recent_orders_by_phone?phone={PHONE}`

**Regras:**
- ✅ Normaliza telefone automaticamente
- ✅ Apenas pedidos dos últimos 90 dias
- ✅ Ordenado do mais recente para o mais antigo
- ✅ Limite de 50 resultados

**Resposta:**
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

### 2. Buscar Status do Pedido

**URL:** `GET /functions/v1/agent_get_order_status?order_id={ORDER_ID}`

**Regras:**
- ✅ Busca pedido por ID
- ✅ Retorna status técnico e label amigável
- ✅ Usa tabela orders como fonte principal

**Resposta:**
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

---

## ✅ Fluxo de Validação Sugerido

### Fase 1: Setup (10 min)
1. ✅ Ler [Guia n8n](./guia-n8n-rastreio-pedidos.md)
2. ✅ Criar token de teste no banco com scope `orders:read`
3. ✅ Ter pedidos de teste no banco (com customer_phone)
4. ✅ Verificar que pedidos são dos últimos 90 dias

### Fase 2: Testes de Sucesso (15 min)
1. ✅ Buscar pedidos por telefone (vários formatos)
2. ✅ Validar normalização de telefone
3. ✅ Buscar status de pedido específico
4. ✅ Validar campos retornados

### Fase 3: Testes de Erro (10 min)
- ❌ Sem token (ambos endpoints)
- ❌ Token inválido (ambos endpoints)
- ❌ Token sem scope `orders:read` (ambos endpoints)
- ❌ Parâmetros faltando (ambos endpoints)
- ❌ Order ID inexistente (endpoint 2)

### Fase 4: Validação Banco (10 min)
- ✅ Conferir pedidos no banco vs API
- ✅ Validar data de 90 dias
- ✅ Validar normalização de telefone
- ✅ Validar status e labels

**Tempo total estimado:** ~45 minutos

---

## 🎯 Testes Específicos

### Teste de Normalização de Telefone

Todos estes formatos devem retornar os **mesmos pedidos**:

| Input | Formato |
|-------|---------|
| `5511999999999` | E.164 completo |
| `11999999999` | Sem código país |
| `(11) 99999-9999` | Formatado |
| `+55 11 99999-9999` | Com + e espaços |

### Teste de Período de 90 Dias

- ✅ Pedidos com menos de 90 dias: **RETORNAM**
- ✅ Pedidos com mais de 90 dias: **NÃO RETORNAM**

### Teste de Ordenação

- ✅ Pedidos ordenados: `created_at DESC` (mais recente primeiro)

---

## 📖 Como Usar os Documentos

### Para Validação Rápida
Use o **[Guia n8n](./guia-n8n-rastreio-pedidos.md)** - passo a passo para configurar workflows.

### Para Entendimento Profundo
Leia **[Documentação Completa](./validacao-rastreio-pedidos.md)** - detalhes de cada endpoint, testes e validações.

### Para Payloads Prontos
Copie de **[payloads-rastreio-pedidos.json](./payloads-rastreio-pedidos.json)** - JSONs formatados para cada endpoint.

---

## 🔍 Validação por Tabela

### tabela: `orders`

```sql
-- Após buscar pedidos por telefone
SELECT 
  id,
  customer_phone,
  current_stage,
  internal_code,
  created_at,
  updated_at
FROM orders
WHERE customer_phone = '5511999999999'
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;

-- Deve retornar o mesmo número de pedidos que a API
```

```sql
-- Após buscar status
SELECT 
  id,
  current_stage,
  updated_at,
  internal_code
FROM orders
WHERE id = 'uuid-do-pedido';

-- Deve conferir com a resposta da API
```

---

## 📝 Checklist Final de Validação

### Testes de Sucesso
- [ ] ✅ Buscar pedidos por telefone funciona
- [ ] ✅ Normalização de telefone funciona (todos os formatos)
- [ ] ✅ Apenas pedidos dos últimos 90 dias
- [ ] ✅ Pedidos ordenados do mais recente para o mais antigo
- [ ] ✅ Buscar status por order_id funciona
- [ ] ✅ Status técnico e label amigável corretos
- [ ] ✅ Campos retornados seguem o contrato

### Testes de Erro
- [ ] ❌ Sem token (todos os endpoints)
- [ ] ❌ Token inválido (todos os endpoints)
- [ ] ❌ Token sem scope `orders:read` (todos os endpoints)
- [ ] ❌ Parâmetros faltando (todos os endpoints)
- [ ] ❌ Order ID inexistente (endpoint 2)

### Validação no Banco
- [ ] Tabela `orders` consultada corretamente
- [ ] Resultados da API = Resultados do banco
- [ ] Data de 90 dias aplicada corretamente
- [ ] Normalização de telefone aplicada corretamente
- [ ] Status e labels conferem com banco

---

## 🚨 Observações Importantes

1. **Sempre HTTP 200:** Mesmo em erros, endpoints retornam status 200. Veja o campo `ok`.
2. **Token Hash:** Use sempre o `token_hash`, não o token em texto.
3. **Normalização Automática:** Telefone é normalizado para E.164 automaticamente.
4. **Período de 90 Dias:** Apenas pedidos recentes são retornados.
5. **Sem Dependência de Opportunities:** Usa apenas a tabela `orders`.
6. **Scope orders:read:** É necessário para acessar os endpoints.

---

## 📞 Problemas?

### Comum: "Missing x-agent-token header"
- Soluções no [Guia n8n](./guia-n8n-rastreio-pedidos.md#troubleshooting)

### Comum: "Invalid or inactive token"
- Soluções no [Guia n8n](./guia-n8n-rastreio-pedidos.md#troubleshooting)

### Comum: "Insufficient permissions"
- Adicione scope `orders:read` ao token no banco

### Comum: Pedidos não retornam
- Verifique se o telefone existe no banco
- Verifique se o pedido foi criado nos últimos 90 dias
- Verifique o formato do telefone

---

## 📈 Status Final

```
✅ 2 endpoints implementados
✅ Autenticação via x-agent-token
✅ Scope orders:read necessário
✅ Normalização automática de telefone
✅ Filtro de 90 dias implementado
✅ Ordenação por data DESC
✅ Sem dependência de opportunities
✅ Documentação completa
✅ Payloads de exemplo
✅ Guia de configuração n8n

🎯 Pronto para validação manual!
```

---

## 📚 Referências

- **URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`
- **Project ID:** `kbpkdnptzvsvoujirfwe`
- **Tabela principal:** `orders`
- **Tabela de tokens:** `agent_tokens`
- **Campo de token:** `token_hash`

---

## 🔗 Links Relacionados

- [Validação de Endpoints IA (Leads, Produtos)](./README-VALIDACAO.md)
- [Payloads de Exemplo Geral](./payloads-exemplo.json)
- [Guia n8n Geral](./guia-n8n-node-config.md)

---

**Comece aqui:** [Guia n8n - Rastreio de Pedidos](./guia-n8n-rastreio-pedidos.md) 👈
