# Especificação Operacional - Orquestrador/n8n

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ EXECUTÁVEL - Pronto para implementação no n8n

---

## Bloco 1: CONTRATO DE SAÍDA DO CLASSIFICADOR

### JSON Padrão

```json
{
  "state": "informational | commercial_signal | qualified_interest | human_handoff",
  "should_offer_handoff": true | false,
  "explicit_confirmation": true | false | null,
  "should_call_write": true | false,
  "already_registered_this_session": true | false,
  "reason": "string explicando a decisão",
  "detected_intent": {
    "type": "informational | price_inquiry | contact_request | budget_request | visit_request | proposal_request | help_decision",
    "confidence": 0.0 - 1.0
  },
  "metadata": {
    "mentioned_product_id": "uuid | null",
    "mentioned_product_name": "string | null",
    "user_phone_extracted": "string | null",
    "user_name_extracted": "string | null"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Valores Possíveis | Descrição |
|-------|------|-------------------|-----------|
| `state` | string | `informational`, `commercial_signal`, `qualified_interest`, `human_handoff` | Estado atual da conversa |
| `should_offer_handoff` | boolean | `true`, `false` | Deve oferecer contato ao usuário? |
| `explicit_confirmation` | boolean | `true`, `false`, `null` | Usuário confirmou explicitamente? (null = não se aplica) |
| `should_call_write` | boolean | `true`, `false` | Deve chamar agent_create_lead_interest? |
| `already_registered_this_session` | boolean | `true`, `false` | Lead já foi criado nesta sessão? |
| `reason` | string | Livre | Explicação da decisão |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `detected_intent` | object | Detalhes da intenção detectada |
| `metadata` | object | Informações extras da conversa |

---

## Bloco 2: TABELA DE DECISÃO EXECUTÁVEL

### Lógica Principal

| Estado | Confirmação Explícita | Já Registrou Sessão | Ação | Resposta Esperada |
|--------|-----------------------|---------------------|-------|---------------------|
| `informational` | N/A | N/A | READ operations | Responder pergunta com dados do catálogo |
| `commercial_signal` | N/A | N/A | READ operations | Responder preço/prazo/informações |
| `qualified_interest` | `false`/`null` | N/A | PERGUNTAR "Gostaria que especialista entrasse em contato?" | Aguardar resposta |
| `qualified_interest` | `true` | `false` | IR para `human_handoff` | Pedir nome e telefone |
| `human_handoff` | `true` | `true` | CONFIRMAR lead existente | "Você já tem interesse registrado" |
| `human_handoff` | `true` | `false` | CALL `agent_create_lead_interest` | Pedir nome e telefone, registrar, confirmar |

### Regras Executáveis

**Regra 1: READ Operations**
```javascript
IF state === "informational" OR state === "commercial_signal":
  CALL: agent_products_search OU agent_product_by_id
  RESPONDER: Com dados do catálogo
  NÃO: Perguntar contato
  NÃO: Chamar write function
```

**Regra 2: Offer Handoff**
```javascript
IF state === "qualified_interest" AND explicit_confirmation !== true:
  PERGUNTAR: "Gostaria que um especialista entrasse em contato?"
  AGUARDAR: Resposta do usuário
  NÃO: Chamar write function
```

**Regra 3: Transition to Human Handoff**
```javascript
IF state === "qualified_interest" AND explicit_confirmation === true:
  SET state = "human_handoff"
  PEDIR: Nome e telefone
  CONTINUAR: Para Regra 4 ou 5
```

**Regra 4: Skip Duplicate**
```javascript
IF state === "human_handoff" AND already_registered_this_session === true:
  RESPONDER: "Você já tem um interesse registrado nesta conversa."
  NÃO: Chamar write function
  RETORNAR: Para state "informational" ou "commercial_signal"
```

**Regra 5: Call Write**
```javascript
IF state === "human_handoff" AND already_registered_this_session === false AND explicit_confirmation === true:
  VALIDAR: Telefone (mínimo 10 dígitos)
  CALL: agent_create_lead_interest
  CONFIRMAR: "Pronto! Registrei seu interesse e especialista entrará em contato."
  SET: session.lead_created = true
```

---

## Bloco 3: REGRAS DE CONFIRMAÇÃO EXPLÍCITA

### Grupo 1: Confirmações Válidas ✅

**Palavras-chave:** "sim", "por favor", "gostaria", "quero", "pode", "aceito", "claro", "com certeza", "é claro", "combinado"

**Tratamento:**
```javascript
IF contains_any(user_message, ["sim", "por favor", "gostaria", "quero", "pode", "aceito", "claro", "com certeza", "é claro", "combinado"]):
  SET explicit_confirmation = true
  PERMITIR: Transição para HUMAN_HANDOFF
  PERMITIR: Chamar write function
```

**Exemplos:**
- "Sim, por favor" → `true`
- "Gostaria, sim" → `true`
- "Quero falar com especialista" → `true`
- "Pode entrar em contato" → `true`

---

### Grupo 2: Confirmações Ambíguas ⚠️

**Palavras-chave:** "talvez", "vou pensar", "preciso considerar", "não sei ainda", "deixa eu ver", "depende", "talvez sim"

**Tratamento:**
```javascript
IF contains_any(user_message, ["talvez", "vou pensar", "preciso considerar", "não sei ainda", "deixa eu ver", "depende"]):
  SET explicit_confirmation = null
  NÃO: Transicionar para HUMAN_HANDOFF
  PERGUNTAR: "Você gostaria de falar com um especialista ou prefere continuar por aqui?"
```

**Exemplos:**
- "Talvez" → `null`
- "Vou pensar" → `null`
- "Depende do preço" → `null`

---

### Grupo 3: Negações ❌

**Palavras-chave:** "não", "agora não", "prefiro", "não preciso", "sem pressa", "deixa pra lá", "não quero"

**Tratamento:**
```javascript
IF contains_any(user_message, ["não", "agora não", "prefiro", "não preciso", "sem pressa", "deixa pra lá", "não quero"]):
  SET explicit_confirmation = false
  NÃO: Transicionar para HUMAN_HANDOFF
  NÃO: Chamar write function
  RETORNAR: Para state "informational"
  RESPONDER: "Sem problemas! Vou te ajudar aqui. O que você gostaria de saber?"
```

**Exemplos:**
- "Não" → `false`
- "Prefiro saber aqui mesmo" → `false`
- "Agora não, obrigado" → `false`

---

### Grupo 4: Sem Confirmação 🤷

**Quando:** Usuário ainda não respondeu à pergunta de contato

**Tratamento:**
```javascript
IF explicit_confirmation === null AND state === "qualified_interest":
  NÃO: Transicionar para HUMAN_HANDOFF
  NÃO: Chamar write function
  AGUARDAR: Próxima mensagem do usuário
  PERGUNTAR: "Gostaria que um especialista entrasse em contato?"
```

---

## Bloco 4: CHECKLIST DE QA OPERACIONAL

### Teste 1: Falso Positivo ✅

**Cenário:** Usuário pergunta preço → Classifica como `qualified_interest` (ERRADO)

**Teste:**
```
Input: "Quanto custa o sofá modelo X?"
Esperado: state = "commercial_signal"
Erro: state = "qualified_interest"
Resultado: FAIL - Usuário não pediu contato
```

**Validação:**
- [ ] Usuário pediu contato/orçamento EXPLICITAMENTE?
- [ ] NÃO é apenas pergunta de preço/prazo?
- [ ] Gatilho está na lista de válidos?

---

### Teste 2: Falso Negativo ❌

**Cenário:** Usuário pede orçamento → Classifica como `commercial_signal` (ERRADO)

**Teste:**
```
Input: "Quero orçamento do sofá modelo X"
Esperado: state = "qualified_interest", should_offer_handoff = true
Erro: state = "commercial_signal", should_offer_handoff = false
Resultado: FAIL - Usuário pediu contato explicitamente
```

**Validação:**
- [ ] Usuário usou gatilho válido ("quero orçamento")?
- [ ] should_offer_handoff está true?
- [ ] state está "qualified_interest"?

---

### Teste 3: Duplicação 🔁

**Cenário:** Usuário pede orçamento 2 vezes na mesma sessão → Cria 2 leads (ERRADO)

**Teste:**
```
Sessão 1:
  Input: "Quero orçamento modelo X"
  Ação: Cria lead 1 ✓
  session.lead_created = true

  Input: "Também quero orçamento modelo Y"
  Ação: Cria lead 2 ✗ ERRO
  Esperado: "Você já tem interesse registrado"
```

**Validação:**
- [ ] session.lead_created está checado?
- [ ] Se true, NÃO cria novo lead?
- [ ] Mensagem de confirmação de lead existente?

---

### Teste 4: Handoff Precoce 🏃

**Cenário:** Usuário pergunta preço → Pergunta contato imediatamente (ERRADO)

**Teste:**
```
Input: "Quanto custa o sofá modelo X?"
Esperado: Responder preço, NÃO perguntar contato
Erro: "Gostaria que especialista entrasse em contato?"
Resultado: FAIL - Handoff prematuro, sem gatilho válido
```

**Validação:**
- [ ] state está "commercial_signal" ou "informational"?
- [ ] should_offer_handoff está false?
- [ ] NÃO perguntou contato?

---

### Teste 5: Write Fora de HUMAN_HANDOFF 🚫

**Cenário:** Usuário pede orçamento → Chama write function sem confirmação (ERRADO)

**Teste:**
```
Input: "Quero orçamento do sofá modelo X"
Esperado: Perguntar "Gostaria que especialista entrasse em contato?"
Erro: Chama agent_create_lead_interest imediatamente
Resultado: FAIL - Write function chamada sem HUMAN_HANDOFF
```

**Validação:**
- [ ] state está "human_handoff"?
- [ ] explicit_confirmation está true?
- [ ] already_registered_this_session está false?
- [ ] Só então chama write function?

---

### Teste 6: Confirmação Ignorada ⚠️

**Cenário:** Usuário diz "não" → Classifica como `true` (ERRADO)

**Teste:**
```
Input: "Não, prefiro saber aqui mesmo"
Esperado: explicit_confirmation = false, state volta para "informational"
Erro: explicit_confirmation = true, continua para HUMAN_HANDOFF
Resultado: FAIL - Negação ignorada
```

**Validação:**
- [ ] Grupo de negações está detectado?
- [ ] explicit_confirmation está false?
- [ ] state voltou para "informational"?

---

### Teste 7: Ambiguidade Não Tratada ❓

**Cenário:** Usuário diz "talvez" → Classifica como `true` (ERRADO)

**Teste:**
```
Input: "Talvez, vou pensar"
Esperado: explicit_confirmation = null, pergunta esclarecimento
Erro: explicit_confirmation = true, vai para HUMAN_HANDOFF
Resultado: FAIL - Ambiguidade não tratada
```

**Validação:**
- [ ] Grupo de ambíguos está detectado?
- [ ] explicit_confirmation está null?
- [ ] Pergunta esclarecimento?

---

### Checklist Final

- [ ] Teste 1: Falso Positivo - PASS
- [ ] Teste 2: Falso Negativo - PASS
- [ ] Teste 3: Duplicação - PASS
- [ ] Teste 4: Handoff Precoce - PASS
- [ ] Teste 5: Write Fora de HUMAN_HANDOFF - PASS
- [ ] Teste 6: Confirmação Ignorada - PASS
- [ ] Teste 7: Ambiguidade Não Tratada - PASS

---

## Bloco 5: PROMPT TÉCNICO PARA O ORQUESTRADOR

### Instruções para Camada de Classificação

```
Você é um CLASSIFICADOR de intenção para atendimento comercial de mobiliário.

SUA FUNÇÃO: Analisar mensagem do usuário e retornar JSON com classificação.

ESTADOS POSSÍVEIS:
- informational: Usuário buscando informações, características, especificações
- commercial_signal: Usuário perguntando preço, prazo, condições de pagamento, garantia
- qualified_interest: Usuário pediu contato, orçamento, visita, proposta ou ajuda para decisão
- human_handoff: Usuário confirmou explicitamente que quer contato humano

GATILHOS PARA qualified_interest:
- "quero orçamento", "preciso de orçamento", "faça orçamento"
- "quero que me liguem", "preciso falar com vendedor", "quero falar com alguém"
- "quero visita técnica", "preciso que alguém venha ver"
- "quero proposta comercial", "preciso de proposta"
- "preciso de ajuda para escolher", "não consigo decidir"

NÃO SÃO GATILHOS:
- "quanto custa", "qual o preço", "qual o prazo", "como funciona", "tem garantia"
- "é bom produto", "recomenda", "tem mais fotos", "mostre mais produtos"

REGRAS:
1. state = "informational" → should_offer_handoff = false, should_call_write = false
2. state = "commercial_signal" → should_offer_handoff = false, should_call_write = false
3. state = "qualified_interest" → should_offer_handoff = true, should_call_write = false
4. state = "human_handoff" → should_call_write = true (SE explicit_confirmation = true E already_registered_this_session = false)

CONFIRMAÇÕES EXPLÍCITAS (true):
"sim", "por favor", "gostaria", "quero", "pode", "aceito", "claro", "com certeza", "é claro", "combinado"

AMBIGUO (null):
"talvez", "vou pensar", "preciso considerar", "não sei ainda", "deixa eu ver", "depende"

NEGAÇÕES (false):
"não", "agora não", "prefiro", "não preciso", "sem pressa", "deixa pra lá", "não quero"

RETORNAR SEMPRE JSON VÁLIDO neste formato:

{
  "state": "informational | commercial_signal | qualified_interest | human_handoff",
  "should_offer_handoff": true | false,
  "explicit_confirmation": true | false | null,
  "should_call_write": true | false,
  "already_registered_this_session": true | false,
  "reason": "explicação curta da decisão",
  "detected_intent": {
    "type": "informational | price_inquiry | contact_request | budget_request | visit_request | proposal_request | help_decision",
    "confidence": 0.0 - 1.0
  }
}

EXEMPLOS:

Input: "Qual a altura do sofá modelo X?"
Output: {"state":"informational","should_offer_handoff":false,"explicit_confirmation":null,"should_call_write":false,"already_registered_this_session":false,"reason":"Usuário perguntando característica de produto","detected_intent":{"type":"informational","confidence":0.95}}

Input: "Quanto custa o sofá modelo X?"
Output: {"state":"commercial_signal","should_offer_handoff":false,"explicit_confirmation":null,"should_call_write":false,"already_registered_this_session":false,"reason":"Usuário perguntando preço","detected_intent":{"type":"price_inquiry","confidence":0.98}}

Input: "Quero orçamento do sofá modelo X"
Output: {"state":"qualified_interest","should_offer_handoff":true,"explicit_confirmation":null,"should_call_write":false,"already_registered_this_session":false,"reason":"Usuário pediu orçamento explicitamente","detected_intent":{"type":"budget_request","confidence":0.99}}

Input: "Sim, por favor"
Output: {"state":"human_handoff","should_offer_handoff":false,"explicit_confirmation":true,"should_call_write":false,"already_registered_this_session":false,"reason":"Usuário confirmou contato explicitamente","detected_intent":{"type":"contact_request","confidence":0.99}}
```

---

## Resumo Executivo

| Bloco | Conteúdo | Status |
|-------|----------|--------|
| 1. Contrato de Saída | JSON padrão com campos obrigatórios/opcionais | ✅ Executável |
| 2. Tabela de Decisão | 5 regras executáveis | ✅ Executável |
| 3. Regras de Confirmação | 4 grupos com tratamento | ✅ Executável |
| 4. Checklist QA | 7 testes operacionais | ✅ Executável |
| 5. Prompt Técnico | Instruções para classificador | ✅ Executável |

---

**Versão:** 1.0  
**Status:** ✅ EXECUTÁVEL - Pronto para implementação no n8n  
**Próxima Revisão:** Quando necessário
