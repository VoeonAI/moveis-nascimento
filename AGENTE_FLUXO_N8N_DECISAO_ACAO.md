# Fluxo n8n - Decisão → Ação

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ OPERACIONAL  
**Objetivo:** Definir fluxo de decisão e ação do agente no n8n

---

## Arquitetura do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO n8n DO AGENTE                     │
└─────────────────────────────────────────────────────────────┘

USUÁRIO
   ↓
[RECEBER MENSAGEM]
   ↓
[DETECTAR INTENÇÃO] → INFORMATIONAL | COMMERCIAL_SIGNAL | QUALIFIED_INTEREST | HUMAN_HANDOFF
   ↓
┌─────────────────────────────────────────────────────────────┐
│                     BRANCH POR ESTADO                       │
└─────────────────────────────────────────────────────────────┘
   ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│INFORMATIONAL │COMMERCIAL_   │QUALIFIED_    │HUMAN_        │
│              │SIGNAL        │INTEREST      │HANDOFF       │
└──────────────┴──────────────┴──────────────┴──────────────┘
   ↓              ↓              ↓              ↓
[READ]         [READ]         [PERGUNTAR]    [VERIFICAR]
                [READ]         [CONTATO]      [LEAD_EXISTE]
   ↓              ↓              ↓              ↓
[RESPONDER]    [RESPONDER]    [AGUARDAR]     [NÃO → PEDIR]
                |               ↓               │
                |           [SIM/NÃO]            [SIM → SKIP]
                |               ↓               │
                |          [NÃO → VOLTA]        ↓
                |               │           [VERIFICAR]
                |               │           [CONFIRMAÇÃO]
                |               │               ↓
                |               │          [SIM → REGISTRAR]
                |               │               ↓
                |               │          [CALL FUNCTION]
                |               │               ↓
                |               │          [CONFIRMAR]
                │               │               ↓
                └───────────────┴───────────────┴─→ [FIM]
```

---

## Fluxo Detalhado por Estado

### FASE 1: DETECÇÃO DE INTENÇÃO

```
[RECEBER MENSAGEM DO USUÁRIO]
   ↓
[ANALISAR CONTEÚDO DA MENSAGEM]
   ↓
[DETERMINAR INTENÇÃO]
   ↓
[CLASSIFICAR EM UM DOS 4 ESTADOS]
   → INFORMATIONAL
   → COMMERCIAL_SIGNAL
   → QUALIFIED_INTEREST
   → HUMAN_HANDOFF
```

---

### FASE 2: BRANCH POR ESTADO

#### FLUXO INFORMATIONAL

```
ESTADO: INFORMATIONAL
   ↓
[AÇÃO: READ]
   ↓
Chamar agent_products_search OU agent_product_by_id
   ↓
[RECEBER RESULTADOS]
   ↓
[AÇÃO: RESPONDER]
   ↓
Responder ao usuário com informações do catálogo
   ↓
[RETORNAR PARA DETECÇÃO]
   ↓
AGUARDAR próxima mensagem do usuário
```

**Exemplo de n8n node:**
```json
{
  "name": "INFORMATIONAL_FLOW",
  "type": "if",
  "condition": "state === 'informational'",
  "then": [
    {
      "name": "SEARCH_PRODUCTS",
      "type": "http_request",
      "url": "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_products_search",
      "method": "GET",
      "params": { "q": "{{ user_message }}" }
    },
    {
      "name": "RESPOND_USER",
      "type": "ai_response",
      "template": "Aqui estão os produtos que encontrei: {{ products }}"
    }
  ]
}
```

---

#### FLUXO COMMERCIAL_SIGNAL

```
ESTADO: COMMERCIAL_SIGNAL
   ↓
[AÇÃO: READ]
   ↓
Chamar agent_products_search OU agent_product_by_id (se necessário)
   ↓
[RECEBER RESULTADOS]
   ↓
[AÇÃO: RESPONDER]
   ↓
Responder ao usuário com informações (preço, prazo, etc.)
   ↓
[DETECTAR NOVO SINAL]
   ↓
Se novo sinal → RETORNAR PARA DETECÇÃO
   ↓
AGUARDAR próxima mensagem do usuário
```

**Exemplo de n8n node:**
```json
{
  "name": "COMMERCIAL_SIGNAL_FLOW",
  "type": "if",
  "condition": "state === 'commercial_signal'",
  "then": [
    {
      "name": "GET_PRODUCT_INFO",
      "type": "http_request",
      "url": "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_product_by_id",
      "method": "GET",
      "params": { "product_id": "{{ detected_product_id }}" }
    },
    {
      "name": "RESPOND_PRICE_INFO",
      "type": "ai_response",
      "template": "O produto {{ product_name }} custa R$ {{ price }}. Quer saber mais?"
    }
  ]
}
```

---

#### FLUXO QUALIFIED_INTEREST

```
ESTADO: QUALIFIED_INTEREST
   ↓
[AÇÃO: PERGUNTAR CONTATO]
   ↓
Perguntar: "Gostaria que um especialista entrasse em contato?"
   ↓
[AGUARDAR RESPOSTA DO USUÁRIO]
   ↓
[ANALISAR RESPOSTA]
   ↓
   [SIM] → Transiciona para HUMAN_HANDOFF
   [NÃO] → Volta para INFORMATIONAL/COMMERCIAL_SIGNAL
   [AMBIGUO] → Continua em QUALIFIED_INTEREST
```

**Exemplo de n8n node:**
```json
{
  "name": "QUALIFIED_INTEREST_FLOW",
  "type": "if",
  "condition": "state === 'qualified_interest'",
  "then": [
    {
      "name": "ASK_CONTACT_CONFIRMATION",
      "type": "ai_response",
      "template": "Entendi que você quer falar com um especialista. Gostaria que um de nossos especialistas entrasse em contato?"
    },
    {
      "name": "WAIT_FOR_RESPONSE",
      "type": "wait_for_input",
      "timeout": "5m"
    },
    {
      "name": "DETECT_CONFIRMATION",
      "type": "ai_classification",
      "classes": ["yes", "no", "ambiguous"],
      "input": "{{ user_response }}"
    },
    {
      "name": "BRANCH_BY_CONFIRMATION",
      "type": "switch",
      "cases": [
        {
          "condition": "classification === 'yes'",
          "then": "HUMAN_HANDOFF_FLOW"
        },
        {
          "condition": "classification === 'no'",
          "then": "INFORMATIONAL_FLOW"
        },
        {
          "condition": "classification === 'ambiguous'",
          "then": "QUALIFIED_INTEREST_FLOW"
        }
      ]
    }
  ]
}
```

---

#### FLUXO HUMAN_HANDOFF

```
ESTADO: HUMAN_HANDOFF
   ↓
[VERIFICAR LEAD_EXISTE_NA_SESSAO]
   ↓
   [NÃO] → PEDIR NOME E TELEFONE
   [SIM] → CONFIRMAR E ENCERRAR
   ↓
   [PEDIR DADOS]
   ↓
[VALIDAR TELEFONE]
   ↓
[VERIFICAR CONFIRMAÇÃO_EXPLÍCITA]
   ↓
   [SIM] → REGISTRAR LEAD
   [NÃO] → VOLTA PARA QUALIFIED_INTEREST
   ↓
   [REGISTRAR]
   ↓
[CALL: agent_create_lead_interest]
   ↓
[RECEBER RESPOSTA]
   ↓
[CONFIRMAR COM USUÁRIO]
   ↓
[ENCERRAR COM ESPERANÇA DE CONTATO]
   ↓
AGUARDAR próxima mensagem do usuário
```

**Exemplo de n8n node:**
```json
{
  "name": "HUMAN_HANDOFF_FLOW",
  "type": "if",
  "condition": "state === 'human_handoff'",
  "then": [
    {
      "name": "CHECK_LEAD_EXISTS",
      "type": "if",
      "condition": "session.lead_created === true",
      "then": [
        {
          "name": "CONFIRM_EXISTING",
          "type": "ai_response",
          "template": "Você já tem um interesse registrado. Um especialista entrará em contato em breve!"
        }
      ],
      "else": [
        {
          "name": "ASK_CONTACT_INFO",
          "type": "ai_response",
          "template": "Ótimo! Qual seu nome e telefone para contato?"
        },
        {
          "name": "WAIT_FOR_CONTACT_INFO",
          "type": "wait_for_input",
          "timeout": "5m"
        },
        {
          "name": "VALIDATE_PHONE",
          "type": "validation",
          "rule": "phone.length >= 10 AND phone.match(/^\\d+$/)",
          "error_message": "Por favor, forneça um telefone válido (apenas números, mínimo 10 dígitos)"
        },
        {
          "name": "SET_SESSION_LEAD_CREATED",
          "type": "set",
          "key": "session.lead_created",
          "value": "true"
        },
        {
          "name": "CALL_CREATE_LEAD_INTEREST",
          "type": "http_request",
          "url": "https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_create_lead_interest",
          "method": "POST",
          "headers": {
            "x-agent-token": "312166dda8c49a5ea856092f016b8333b1086fdb9a42abc98b1037f7ba0856f0",
            "content-type": "application/json"
          },
          "body": {
            "customer_name": "{{ user_name }}",
            "customer_phone": "{{ user_phone }}",
            "message": "{{ conversation_summary }}",
            "source": "n8n",
            "context": {
              "intent": "human_handoff",
              "product_id": "{{ detected_product_id }}",
              "product_name": "{{ detected_product_name }}",
              "category_slug": "{{ detected_category_slug }}"
            }
          }
        },
        {
          "name": "CONFIRM_LEAD_CREATED",
          "type": "ai_response",
          "template": "Pronto, {{ customer_name }}! Registrei seu interesse e um especialista entrará em contato em breve pelo telefone {{ customer_phone }}."
        }
      ]
    }
  ]
}
```

---

## Tabela de Decisão (Branch Logic)

### Tabela 1: Classificação de Intenção

| Mensagem do Usuário | Estado Classificado | Ação |
|---------------------|---------------------|------|
| "Qual a altura do sofá?" | INFORMATIONAL | READ produtos |
| "Qual o preço do sofá?" | COMMERCIAL_SIGNAL | READ preço |
| "Quero orçamento" | QUALIFIED_INTEREST | Perguntar contato |
| "Quero falar com vendedor" | QUALIFIED_INTEREST | Perguntar contato |
| "Sim, por favor" | HUMAN_HANDOFF | Verificar lead |
| "Não, prefiro aqui" | INFORMATIONAL | Voltar |

---

### Tabela 2: Decisão de Perguntar Contato

| Estado | Usuário Pediu | Usuário Confirmou | Ação |
|--------|---------------|------------------|------|
| INFORMATIONAL | Não | N/A | NÃO perguntar |
| COMMERCIAL_SIGNAL | Não | N/A | NÃO perguntar |
| QUALIFIED_INTEREST | Sim | Não confirmou | Perguntar, aguardar |
| QUALIFIED_INTEREST | Sim | Confirmou SIM | Ir para HUMAN_HANDOFF |
| QUALIFIED_INTEREST | Sim | Confirmou NÃO | Voltar para INFORMATIONAL |
| HUMAN_HANDOFF | Confirmou SIM | Verificar | Pedir dados, registrar |

---

### Tabela 3: Decisão de Registrar Lead

| Lead Existe? | Confirmação Explícita? | Telefone Válido? | Ação |
|--------------|------------------------|------------------|------|
| Sim | N/A | N/A | NÃO registrar (confirma existente) |
| Não | Não | N/A | NÃO registrar (aguardar confirmação) |
| Não | Sim | Não | Pedir telefone válido |
| Não | Sim | Sim | ✅ REGISTRAR |

---

## Diagrama de Estados (Finite State Machine)

```
         ┌─────────────────┐
         │  INFORMATIONAL  │
         └────────┬────────┘
                  │ (usuário pergunta preço/prazo)
                  ↓
         ┌─────────────────┐
         │COMMERCIAL_SIGNAL│
         └────────┬────────┘
                  │ (usuário pede contato/orçamento)
                  ↓
         ┌─────────────────┐
         │QUALIFIED_INTEREST│
         └────────┬────────┘
                  │ (usuário confirma SIM)
                  ↓
         ┌─────────────────┐
         │  HUMAN_HANDOFF  │
         └────────┬────────┘
                  │ (registra lead)
                  ↓
         ┌─────────────────┐
         │     RETURN      │ ← volta para INFORMATIONAL
         └─────────────────┘

         [QUALIFIED_INTEREST]
                  │ (usuário diz NÃO)
                  ↓
         ┌─────────────────┐
         │  INFORMATIONAL  │
         └─────────────────┘
```

---

## Fluxo Completo (Pseudocódigo)

```
FUNCTION main(user_message, session_state):
    
    // FASE 1: DETECTAR INTENÇÃO
    intent = detect_intent(user_message, session_state)
    
    // FASE 2: BRANCH POR ESTADO
    SWITCH intent.state:
        
        CASE "informational":
            // READ OPERATION
            products = agent_products_search(user_message)
            response = format_informational_response(products)
            SEND response
            RETURN
            
        CASE "commercial_signal":
            // READ OPERATION
            if needs_product_info(user_message):
                products = agent_product_by_id(detected_product_id)
            response = format_commercial_response(products)
            SEND response
            RETURN
            
        CASE "qualified_interest":
            // PERGUNTAR CONTATO
            IF NOT session.contact_confirmation_asked:
                response = "Gostaria que um especialista entrasse em contato?"
                session.contact_confirmation_asked = true
                SEND response
                RETURN
                
            // AGUARDAR CONFIRMAÇÃO
            user_response = WAIT_FOR_INPUT()
            
            IF is_yes_confirmation(user_response):
                SET session_state = "human_handoff"
                RESTART main(user_message, session_state)
                
            ELSE IF is_no_response(user_response):
                SET session_state = "informational"
                RESET session.contact_confirmation_asked
                RESTART main(user_message, session_state)
                
            ELSE:
                // Ambiguo - pedir esclarecimento
                response = "Você gostaria de falar com um especialista ou prefere continuar por aqui?"
                SEND response
                RETURN
                
        CASE "human_handoff":
            // VERIFICAR LEAD EXISTENTE
            IF session.lead_created:
                response = "Você já tem um interesse registrado. Um especialista entrará em contato em breve!"
                SEND response
                RETURN
            
            // PEDIR DADOS
            IF NOT has_contact_info(session):
                response = "Qual seu nome e telefone para contato?"
                SEND response
                
                user_response = WAIT_FOR_INPUT()
                
                // EXTRAI NOME E TELEFONE
                name = extract_name(user_response)
                phone = extract_phone(user_response)
                
                // VALIDAR TELEFONE
                IF NOT is_valid_phone(phone):
                    response = "Por favor, forneça um telefone válido (mínimo 10 dígitos, apenas números)."
                    SEND response
                    RETURN
                    
                SET session.customer_name = name
                SET session.customer_phone = phone
                SET session.has_contact_info = true
                
            // REGISTRAR LEAD
            IF NOT is_explicit_confirmation(session):
                response = "Confirmo que vou registrar seu interesse. Um especialista entrará em contato. Pode confirmar?"
                SEND response
                
                user_response = WAIT_FOR_INPUT()
                
                IF NOT is_yes_confirmation(user_response):
                    // Usuário mudou de ideia
                    RESET session.lead_creation
                    SET session_state = "informational"
                    RESTART main(user_message, session_state)
                    
                SET session.is_explicit_confirmation = true
                
            // CALL FUNCTION
            result = agent_create_lead_interest({
                customer_name: session.customer_name,
                customer_phone: session.customer_phone,
                message: session.conversation_summary,
                source: "n8n",
                context: {
                    intent: "human_handoff",
                    product_id: session.detected_product_id,
                    product_name: session.detected_product_name
                }
            })
            
            IF result.ok:
                SET session.lead_created = true
                response = f"Pronto, {session.customer_name}! Registrei seu interesse e um especialista entrará em contato em breve pelo telefone {session.customer_phone}."
                SEND response
            ELSE:
                response = "Desculpe, ocorreu um erro ao registrar seu interesse. Tente novamente em instantes."
                SEND response
                
            RETURN
```

---

## Validações e Guard Rails

### Validação 1: Estado Transicional

```
[VERIFICAR] Estado atual permite transição para novo estado?
[REGRAS]
  - INFORMATIONAL → COMMERCIAL_SIGNAL ✅
  - INFORMATIONAL → QUALIFIED_INTEREST ❌
  - COMMERCIAL_SIGNAL → QUALIFIED_INTEREST ✅
  - QUALIFIED_INTEREST → HUMAN_HANDOFF ✅
  - QUALIFIED_INTEREST → INFORMATIONAL ✅
  - HUMAN_HANDOFF → INFORMATIONAL ✅
```

---

### Validação 2: Lead Creation

```
[VERIFICAR] Pode criar lead?
[REGRAS]
  - Estado = HUMAN_HANDOFF ✅
  - Usuário confirmou explicitamente ✅
  - Lead ainda não existe nesta sessão ✅
  - Telefone é válido ✅
  
  ❌ SE qualquer regra falhar → NÃO criar lead
```

---

### Validação 3: Anti-Spam

```
[VERIFICAR] Pode perguntar contato novamente?
[REGRAS]
  - lead_created = false ✅
  - contact_confirmation_asked = false OU
  - (contact_confirmation_asked = true E user_respondeu) ✅
  
  ❌ SE lead_created = true → NÃO perguntar novamente
```

---

## Resumo Executivo do Fluxo

| Fase | Decisão | Ação | READ | WRITE |
|------|---------|------|------|-------|
| **1** | Detectar intenção | Classificar estado | - | - |
| **2** | INFORMATIONAL | Buscar produtos | ✅ | ❌ |
| **3** | COMMERCIAL_SIGNAL | Buscar preço | ✅ | ❌ |
| **4** | QUALIFIED_INTEREST | Perguntar contato | - | - |
| **5** | HUMAN_HANDOFF | Registrar lead | ✅ | ✅ |

---

## Implementação em n8n

### Nodes Principais

1. **Start Node** - Recebe mensagem do usuário
2. **Intent Detection Node** - Classifica intenção
3. **State Switch Node** - Branch por estado
4. **Informational Flow** - READ operations
5. **Commercial Signal Flow** - READ operations
6. **Qualified Interest Flow** - Pergunta + aguarda
7. **Human Handoff Flow** - WRITE operation
8. **Lead Validation Node** - Valida antes de registrar
9. **Function Call Node** - Chama agent_create_lead_interest
10. **Response Node** - Responde ao usuário

---

**Versão:** 1.0  
**Status:** ✅ OPERACIONAL  
**Próxima Revisão:** Quando necessário
