# Documentação da API de Integração IA

📋 **Documentação completa da API de agentes de IA**

---

## 📚 Índice de Documentos

### 📖 Documentação Principal

| Documento | Descrição | Para Quem? |
|-----------|-----------|-----------|
| **[Quick Start](./QUICK-START-DEV.md)** | Comece aqui! Setup em 5 minutos | Desenvolvedores |
| **[Manual Completo](./MANUAL-INTEGRACAO-API.md)** | Documentação detalhada de todos os endpoints | Desenvolvedores e Integradores |
| **[API Reference](./API-REFERENCE.md)** | Referência rápida de todos os endpoints | Desenvolvedores |
| **[Exemplos JSON](./exemplos-json-prontos.md)** | Exemplos prontos para copiar | Desenvolvedores |

### 🚀 Validação e Testes

| Documento | Descrição | Status |
|-----------|-----------|--------|
| **[Validação Rastreio](./README-RASTREIO.md)** | Guia principal de rastreio de pedidos | ✅ Validado |
| **[Relatório Rastreio](./VALIDACAO-FINAL-RASTREIO.md)** | Relatório final de validação | ✅ 16/16 testes passados |
| **[Detalhes Rastreio](./validacao-rastreio-pedidos.md)** | Documentação detalhada de rastreio | ✅ Implementado |
| **[Comandos Teste Rastreio](./comandos-teste-rastreio.md)** | Comandos cURL e SQL para teste | ✅ Pronto |

### 🔧 Integração n8n

| Documento | Descrição | Uso |
|-----------|-----------|-----|
| **[Guia n8n - Leads/Produtos](./guia-n8n-node-config.md)** | Configuração de nós HTTP | n8n |
| **[Guia n8n - Rastreio](./guia-n8n-rastreio-pedidos.md)** | Configuração para rastreio | n8n |
| **[Checklist n8n](./checklist-validacao-n8n.md)** | Checklist de validação | n8n |
| **[Payloads Gerais](./payloads-exemplo.json)** | Payloads JSON prontos | n8n |
| **[Payloads Rastreio](./payloads-rastreio-pedidos.json)** | Payloads de rastreio | n8n |

---

## 🚀 Começando Rápido

### Para Desenvolvedores Novos

1. ✅ Leia o **[Quick Start](./QUICK-START-DEV.md)** (5 minutos)
2. ✅ Configure seu token de acesso
3. ✅ Teste a conexão com o endpoint de exemplo
4. ✅ Consulte o **[Manual Completo](./MANUAL-INTEGRACAO-API.md)** para detalhes

### Para Integração com n8n

1. ✅ Leia o **[Guia n8n](./guia-n8n-node-config.md)** (10 minutos)
2. ✅ Configure os nós HTTP Request
3. ✅ Use os **[Payloads Exemplo](./payloads-exemplo.json)** prontos
4. ✅ Valide com o **[Checklist](./checklist-validacao-n8n.md)**

### Para Validação de Rastreio

1. ✅ Leia o **[Guia Rastreio](./README-RASTREIO.md)**
2. ✅ Consulte o **[Relatório Final](./VALIDACAO-FINAL-RASTREIO.md)**
3. ✅ Execute os **[Comandos de Teste](./comandos-teste-rastreio.md)**
4. ✅ Valide resultados

---

## 📊 Endpoints Disponíveis

**Total:** 8 endpoints

### 📦 Produtos (2)
- `agent_products_search` - Buscar produtos
- `agent_product_by_id` - Produto por ID

### 🚚 Pedidos (2)
- `agent_find_recent_orders_by_phone` - Pedidos por telefone
- `agent_get_order_status` - Status do pedido

### 📝 Leads (3)
- `agent_create_lead` - Criar lead
- `agent_update_lead_status` - Atualizar status
- `agent_add_lead_note` - Adicionar nota

### 👷 Montadores (1)
- `agent_get_assemblers` - Lista de montadores

---

## 🔐 Autenticação

### Header de Autenticação

```
x-agent-token: {TOKEN_HASH}
```

### Scopes Disponíveis

| Scope | Permissão |
|-------|-----------|
| `products:read` | Ler produtos |
| `products:read_private` | Ler preços/estoque |
| `orders:read` | Ler pedidos |
| `leads:read` | Ler leads |
| `leads:write` | Criar/modificar leads |
| `leads:update` | Atualizar status |

---

## 📋 Observações de Negócio Importantes

### ⚠️ Pedidos por Telefone - Janela de 90 Dias

**Endpoint:** `agent_find_recent_orders_by_phone`

- Apenas pedidos dos **últimos 90 dias** são retornados
- Pedidos mais antigos são automaticamente filtrados
- Justificativa: Mantém foco em pedidos ativos e recentes

---

### ⚠️ Status talking_ai/talking_human

**Contexto:**
- `talking_ai` e `talking_human` são status da tabela `opportunities`
- **Não** são da tabela `leads`

---

### ⚠️ Dados Privados de Produto

**Endpoint:** `agent_product_by_id`

- Dados privados (preço, estoque) só retornam com scope `products:read_private`
- Sem esse scope, campo `private` é `null`

---

### ⚠️ Normalização de Telefone

**Endpoint:** `agent_find_recent_orders_by_phone`

- Aceita qualquer formato: `5511999999999`, `11999999999`, `(11) 99999-9999`
- Normaliza automaticamente para E.164

---

### ⚠️ Timeline Automática de Leads

**Endpoints:** `agent_create_lead`, `agent_update_lead_status`, `agent_add_lead_note`

- Qualquer operação cria registro na tabela `lead_timeline`
- Campo `last_activity_at` é atualizado automaticamente

---

## 🎯 Por Onde Começar?

| Seu Objetivo | Comece Aqui |
|---------------|--------------|
| Sou novo na integração | [Quick Start](./QUICK-START-DEV.md) |
| Quero detalhes de um endpoint | [Manual Completo](./MANUAL-INTEGRACAO-API.md) |
| Preciso de exemplos prontos | [Exemplos JSON](./exemplos-json-prontos.md) |
| Integrar com n8n | [Guia n8n](./guia-n8n-node-config.md) |
| Validar rastreio de pedidos | [Guia Rastreio](./README-RASTREIO.md) |
| Referência rápida | [API Reference](./API-REFERENCE.md) |

---

## 📊 Status da Documentação

| Categoria | Documentos | Status |
|-----------|-------------|--------|
| 📖 Documentação Principal | 4 documentos | ✅ Completo |
| 🚀 Validação | 4 documentos | ✅ Validado |
| 🔧 Integração n8n | 5 documentos | ✅ Pronto |

**Total:** 13 documentos disponíveis

---

## 🔗 Links Rápidos

### Documentação Principal
- [Quick Start](./QUICK-START-DEV.md) ← **Comece aqui!**
- [Manual Completo](./MANUAL-INTEGRACAO-API.md)
- [API Reference](./API-REFERENCE.md)
- [Exemplos JSON](./exemplos-json-prontos.md)

### Validação
- [Guia Rastreio](./README-RASTREIO.md)
- [Relatório Final](./VALIDACAO-FINAL-RASTREIO.md)

### Integração n8n
- [Guia n8n Geral](./guia-n8n-node-config.md)
- [Guia n8n Rastreio](./guia-n8n-rastreio-pedidos.md)
- [Checklist n8n](./checklist-validacao-n8n.md)

---

## 💡 Dicas de Uso

### Para Desenvolvedores

1. **Sempre** use o campo `ok` para verificar sucesso/erro
2. **Todos** os erros retornam HTTP 200
3. **Normalização** de telefone é automática
4. **Dados privados** dependem do scope `products:read_private`

### Para Integradores n8n

1. **Configure** o header `x-agent-token` em todos os nós
2. **Use** os payloads JSON prontos para economizar tempo
3. **Valide** cada endpoint com o checklist
4. **Consulte** os guias específicos para rastreio

---

## 📞 Suporte

**URL Base da API:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Project ID:** `kbpkdnptzvsvoujirfwe`

**Tabela de Tokens:** `agent_tokens`

---

**Versão:** 2.0  
**Última atualização:** 2024-03-28

---

**🎉 Documentação completa e atualizada!**
