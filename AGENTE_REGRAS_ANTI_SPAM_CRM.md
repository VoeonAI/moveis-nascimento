# Regras Anti-Spam no CRM

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ OPERACIONAL  
**Objetivo:** Garantir que o CRM não seja poluído com leads duplicados, irrelevantes ou de baixa qualidade

---

## Princípios Fundamentais

**🎯 Qualidade sobre Quantidade:**
- Um lead de qualidade vale mais que 10 leads de baixa qualidade
- Lead só deve ser criado quando há intenção comercial explícita
- Duplicação deve ser evitada a todo custo

**🛡️ Proteção do CRM:**
- O CRM deve ser limpo e organizado
- Leads de baixa qualidade distraem a equipe de vendas
- Spam reduz a eficácia da equipe de atendimento

**📊 Métricas de Qualidade:**
- Taxa de conversão de leads
- Feedback da equipe de vendas
- Taxa de leads qualificados vs não qualificados

---

## Regra 1: One Per Session (Um Lead por Sessão)

### Definição

**Cada conversa de um mesmo usuário deve gerar NO MÁXIMO UM lead.**

### Implementação

#### No Nível de Sessão (n8n)

```
SESSÃO DO USUÁRIO:
{
  "user_id": "uuid-ou-identificador",
  "session_id": "session-uuid",
  "lead_created": false,
  "lead_id": null,
  "conversation_history": []
}
```

#### Lógica de Controle

```javascript
// Verificar se lead já foi criado na sessão
if (session.lead_created === true) {
  // NÃO criar novo lead
  return "Você já tem um interesse registrado nesta conversa. Um especialista entrará em contato em breve!";
}

// Se não, proceder com criação
session.lead_created = true;
session.lead_id = result.lead_id;
```

#### Exemplo de Correto

```
Sessão 1:
Usuário: "Quero orçamento do sofá X"
Agente: [Confirma, cria lead] ✅
session.lead_created = true

Usuário: "Também quero orçamento do sofá Y"
Agente: "Você já tem um interesse registrado. Especialista vai te ajudar." ✅
session.lead_created = true (já existe)
```

#### Exemplo de Incorreto

```
Sessão 1:
Usuário: "Quero orçamento do sofá X"
Agente: [Cria lead 1] ❌

Usuário: "Também quero orçamento do sofá Y"
Agente: [Cria lead 2] ❌ DUPLICADO
```

---

## Regra 2: Deduplication por Telefone

### Definição

**Mesmo usuário em sessões diferentes: Reutilizar lead existente por telefone.**

### Implementação (Já Existe em `agent_create_lead_interest`)

A função `agent_create_lead_interest` já faz upsert por telefone:

```sql
-- Tenta encontrar lead por telefone
SELECT * FROM leads
WHERE phone = normalized_phone
  AND archived = false
LIMIT 1;

-- Se encontrar, reutiliza
-- Se não encontrar, cria novo
```

#### Exemplo de Correto

```
Sessão 1 (Dia 1):
Usuário: "João, 11 99999-9999"
Agente: [Cria lead A] ✅

Sessão 2 (Dia 7):
Usuário: "João, 11 99999-9999"
Agente: [Reutiliza lead A] ✅
```

#### Exemplo de Incorreto

```
Sessão 1 (Dia 1):
Usuário: "João, 11 99999-9999"
Agente: [Cria lead A] ❌

Sessão 2 (Dia 7):
Usuário: "João, 11 99999-9999"
Agente: [Cria lead B] ❌ DUPLICADO
```

---

## Regra 3: Tempo Mínimo Entre Leads do Mesmo Telefone

### Definição

**Mesmo telefone: Só criar novo lead após X dias do último lead.**

### Implementação Sugerida

```sql
-- Verificar lead mais recente do telefone
SELECT created_at
FROM leads
WHERE phone = normalized_phone
  AND archived = false
ORDER BY created_at DESC
LIMIT 1;

-- Se created_at > X dias → NÃO criar novo lead
-- Se created_at <= X dias → Criar novo lead
```

#### Exemplo (X = 7 dias)

```
Sessão 1 (Dia 1):
Usuário: "João, 11 99999-9999"
Agente: [Cria lead A] ✅

Sessão 2 (Dia 3 - < 7 dias):
Usuário: "João, 11 99999-9999"
Agente: "Você tem um interesse registrado recentemente (3 dias atrás). Especialista já está processando." ✅

Sessão 3 (Dia 15 - >= 7 dias):
Usuário: "João, 11 99999-9999"
Agente: [Cria lead B] ✅ (aceitável)
```

### Configuração Recomendada

**Tempo mínimo:** 7 dias (pode ser ajustado)

**Lógica:**
- Menos de 7 dias → Reutilizar lead existente
- 7 dias ou mais → Criar novo lead

---

## Regra 4: Confirmação Obrigatória

### Definição

**Lead só pode ser criado após confirmação EXPLÍCITA do usuário.**

### Validação

```javascript
// Palavras-chave que indicam confirmação EXPLÍCITA
const CONFIRMATION_KEYWORDS = [
  "sim",
  "por favor",
  "gostaria",
  "quero",
  "pode",
  "aceito",
  "claro",
  "com certeza"
];

function isExplicitConfirmation(userMessage) {
  return CONFIRMATION_KEYWORDS.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
}

// Usar na decisão de criar lead
if (!isExplicitConfirmation(userMessage)) {
  return "Por favor, confirme que gostaria de falar com um especialista.";
}
```

#### Exemplo de Correto

```
Usuário: "Quero orçamento"
Agente: "Gostaria que especialista entrasse em contato?"

Usuário: "Sim, por favor" ✅ CONFIRMAÇÃO EXPLÍCITA
Agente: [Cria lead] ✅
```

#### Exemplo de Incorreto

```
Usuário: "Quero orçamento"
Agente: [Assume "sim"] ❌ SEM CONFIRMAÇÃO
Agente: [Cria lead] ❌
```

---

## Regra 5: Mensagem de Qualidade Mínima

### Definição

**Lead só pode ser criado com mensagem/contexto de qualidade.**

### Validação

```javascript
// Mínimo de caracteres na mensagem
const MIN_MESSAGE_LENGTH = 10;

// Mensagem deve conter pelo menos:
// - Nome do cliente OU
// - Interesse em produto OU
// - Contexto da conversa

function isValidLeadMessage(message) {
  return message.length >= MIN_MESSAGE_LENGTH;
}

// Usar antes de criar lead
if (!isValidLeadMessage(message)) {
  return "Preciso de mais informações para registrar seu interesse. Por favor, me conte mais sobre o que você precisa.";
}
```

#### Exemplo de Correto

```
Mensagem: "Cliente interessado em sofá Modelo Y (3 lugares, couro preto, R$ 3.200,00)" ✅
Agente: [Cria lead] ✅
```

#### Exemplo de Incorreto

```
Mensagem: "" ❌ VAZIA
Agente: "Preciso de mais informações..." ✅

Mensagem: "." ❌ CURTA
Agente: "Preciso de mais informações..." ✅
```

---

## Regra 6: Telefone Válido

### Definição

**Lead só pode ser criado com telefone válido.**

### Validação

```javascript
// Telefone válido:
// - Mínimo 10 dígitos
// - Apenas números
// - Formato: DDD + número

function isValidPhone(phone) {
  // Remove não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida tamanho
  if (cleaned.length < 10) {
    return false;
  }
  
  // Valida se é apenas números
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  
  return true;
}

// Usar antes de criar lead
if (!isValidPhone(phone)) {
  return "Por favor, forneça um telefone válido (mínimo 10 dígitos, apenas números).";
}
```

#### Exemplo de Correto

```
Telefone: "11999999999" ✅
Agente: [Cria lead] ✅

Telefone: "11 99999-9999" → "11999999999" ✅
Agente: [Cria lead] ✅
```

#### Exemplo de Incorreto

```
Telefone: "" ❌ VAZIO
Agente: "Por favor, forneça um telefone válido." ✅

Telefone: "123" ❌ CURTO
Agente: "Por favor, forneça um telefone válido (mínimo 10 dígitos)." ✅

Telefone: "abc" ❌ NÃO NUMÉRICO
Agente: "Por favor, forneça um telefone válido (apenas números)." ✅
```

---

## Regra 7: Human Handoff Only

### Definição

**Lead só pode ser criado no estado HUMAN_HANDOFF.**

### Validação

```javascript
// Estados permitidos para criar lead
const ALLOWED_STATES_FOR_LEAD_CREATION = ["human_handoff"];

function canCreateLead(currentState) {
  return ALLOWED_STATES_FOR_LEAD_CREATION.includes(currentState);
}

// Usar antes de criar lead
if (!canCreateLead(session.state)) {
  return "Ainda não identifiquei seu interesse. Quer saber mais sobre nossos produtos?";
}
```

#### Exemplo de Correto

```
Estado: "human_handoff" ✅
Agente: [Cria lead] ✅
```

#### Exemplo de Incorreto

```
Estado: "informational" ❌
Agente: "Ainda não identifiquei seu interesse..." ✅

Estado: "commercial_signal" ❌
Agente: "Ainda não identifiquei seu interesse..." ✅

Estado: "qualified_interest" ❌ (sem confirmação)
Agente: "Gostaria que especialista entrasse em contato?" ✅
```

---

## Regra 8: Monitoramento de Taxa de Conversão

### Definição

**Monitorar taxa de conversão de leads para identificar spam de baixa qualidade.**

### Métricas

```sql
-- Taxa de conversão de leads por período
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
  ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Leads por telefone (identificar duplicados)
SELECT 
  phone,
  COUNT(*) as lead_count,
  MAX(created_at) as last_created
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY lead_count DESC;

-- Taxa de leads sem follow-up
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN last_followup_at IS NULL THEN 1 END) as no_followup,
  ROUND(COUNT(CASE WHEN last_followup_at IS NULL THEN 1 END) * 100.0 / COUNT(*), 2) as no_followup_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Alertas

**Alertar quando:**
- Taxa de conversão < 10% em 7 dias
- Mais de 5 leads do mesmo telefone em 30 dias
- Taxa de leads sem follow-up > 80% em 7 dias
- Aumento súbito de criação de leads (> 200% aumento dia a dia)

---

## Regra 9: Feedback da Equipe de Vendas

### Definição

**Coletar feedback da equipe de vendas sobre qualidade dos leads.**

### Implementação

**Adicionar campo `lead_quality_score` em `leads`:**

```sql
ALTER TABLE leads ADD COLUMN lead_quality_score INTEGER DEFAULT NULL;
-- 1 = Baixa qualidade
-- 2 = Qualidade média
-- 3 = Alta qualidade
-- 4 = Muito alta qualidade
-- 5 = Excelente qualidade
```

**Monitorar pontuação média:**

```sql
SELECT 
  DATE(created_at) as date,
  AVG(lead_quality_score) as avg_quality_score,
  COUNT(*) as total_leads_with_score
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND lead_quality_score IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Ações Baseadas em Feedback

**Se pontuação média < 2.5 em 7 dias:**
- Revisar critérios de criação de leads
- Aumentar rigor na validação
- Reduzir sensibilidade de gatilhos

---

## Regra 10: Auditoria Periódica

### Definição

**Realizar auditoria periódica de leads para identificar padrões de spam.**

### Checklist de Auditoria

**Semanalmente:**
- [ ] Verificar leads duplicados por telefone
- [ ] Verificar leads com mesma mensagem/contexto
- [ ] Verificar leads com taxas de conversão anormais
- [ ] Analisar feedback da equipe de vendas

**Mensalmente:**
- [ ] Analisar tendências de qualidade de leads
- [ ] Revisar taxas de conversão
- [ ] Ajustar regras anti-spam se necessário
- [ ] Documentar mudanças

---

## Checklist Anti-Spam

Antes de chamar `agent_create_lead_interest`, verificar:

**Sessão:**
- [ ] session.lead_created = false? (One per session)

**Confirmação:**
- [ ] Usuário confirmou explicitamente? ("sim", "por favor", etc.)

**Estado:**
- [ ] Estado atual é HUMAN_HANDOFF?

**Dados:**
- [ ] Telefone válido? (mínimo 10 dígitos, apenas números)
- [ ] Nome fornecido?
- [ ] Mensagem/contexto de qualidade? (mínimo 10 caracteres)

**Duplicação:**
- [ ] Lead já existe para este telefone?
  - Se SIM: Verificar tempo desde última criação
  - Se < 7 dias: Reutilizar lead existente
  - Se >= 7 dias: Criar novo lead

**Qualidade:**
- [ ] Mensagem é relevante para venda?
- [ ] Contexto está claro?
- [ ] Não é spam óbvio?

**❌ Se qualquer item for NÃO → NÃO criar lead**

---

## Resumo das Regras

| Regra | Descrição | Implementação |
|-------|-----------|---------------|
| 1. One Per Session | Um lead por conversa | session.lead_created |
| 2. Deduplication | Reutilizar lead por telefone | Já existe em agent_create_lead_interest |
| 3. Tempo Mínimo | 7 dias entre leads do mesmo telefone | Verificar created_at |
| 4. Confirmação | Confirmação explícita obrigatória | Validar "sim", "por favor", etc. |
| 5. Mensagem Qualidade | Mínimo 10 caracteres | Validar message.length |
| 6. Telefone Válido | Mínimo 10 dígitos, apenas números | Validar phone format |
| 7. Human Handoff Only | Só no estado HUMAN_HANDOFF | Validar state |
| 8. Monitoramento | Taxa de conversão, duplicados | Queries de monitoramento |
| 9. Feedback Vendas | lead_quality_score | Coletar pontuação |
| 10. Auditoria | Revisão periódica | Checklist semanal/mensal |

---

**Versão:** 1.0  
**Status:** ✅ OPERACIONAL  
**Próxima Revisão:** Quando necessário
