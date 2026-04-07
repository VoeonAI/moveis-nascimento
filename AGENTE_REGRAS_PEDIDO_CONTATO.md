# Regras Exatas - Quando Perguntar pelo Contato

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ OPERACIONAL  
**Objetivo:** Definir precisamente quando o agente deve solicitar contato ao usuário

---

## Princípio Fundamental

**❌ NUNCA perguntar pelo contato:**
- Na primeira interação
- Quando usuário apenas busca informações
- Quando há curiosidade apenas
- Quando usuário navega pelo catálogo
- Quando não há sinal de intenção de compra

**✅ SÓ perguntar pelo contato:**
- Após identificar pedido explícito de contato humano
- No estado QUALIFIED_INTEREST
- Antes de chamar `agent_create_lead_interest`

---

## Momento Certo para Perguntar

### ✅ QUANDO PERGUNTAR (Gatilhos Exatos)

**Perguntar contato SOMENTE quando usuário disser:**

1. **"Quero orçamento"** → Perguntar contato
2. **"Preciso de orçamento"** → Perguntar contato
3. **"Faça orçamento"** → Perguntar contato
4. **"Quero que me liguem"** → Perguntar contato
5. **"Preciso falar com vendedor"** → Perguntar contato
6. **"Quero falar com alguém"** → Perguntar contato
7. **"Quero que alguém me chame"** → Perguntar contato
8. **"Quero visita técnica"** → Perguntar contato
9. **"Preciso que alguém venha"** → Perguntar contato
10. **"Quero proposta comercial"** → Perguntar contato
11. **"Preciso de proposta"** → Perguntar contato
12. **"Quero ajuda para escolher"** → Perguntar contato
13. **"Não consigo decidir sozinho"** → Perguntar contato
14. **"Quero falar com especialista"** → Perguntar contato

**Regra:** Se usuário usa "quero", "preciso", "falar", "ligar", "visita", "proposta", "ajuda" com intenção de contato → PERGUNTAR CONTATO.

---

### ❌ QUANDO NÃO PERGUNTAR (Gatilhos Falsos)

**NÃO perguntar contato quando usuário disser:**

1. **"Quanto custa?"** → NÃO perguntar
2. **"Qual o preço?"** → NÃO perguntar
3. **"Qual o prazo de entrega?"** → NÃO perguntar
4. **"Qual a forma de pagamento?"** → NÃO perguntar
5. **"Tem garantia?"** → NÃO perguntar
6. **"Como funciona?"** → NÃO perguntar
7. **"Quais as dimensões?"** → NÃO perguntar
8. **"Qual material é feito?"** → NÃO perguntar
9. **"Tem em estoque?"** → NÃO perguntar
10. **"Quantos dias pra entregar?"** → NÃO perguntar
11. **"Vale a pena?"** → NÃO perguntar
12. **"É bom produto?"** → NÃO perguntar
13. **"Recomenda esse produto?"** → NÃO perguntar
14. **"Tem mais fotos?"** → NÃO perguntar
15. **"Mostre mais produtos"** → NÃO perguntar

**Regra:** Se usuário está apenas buscando informações → RESPONDER sem pedir contato.

---

## Padrão de Pergunta de Contato

### ✅ Pergunta Padrão (Correta)

Quando identificar gatilho válido, usar EXATAMENTE:

```
"Entendi que você gostaria de falar com um especialista.
Você gostaria que um de nossos especialistas entrasse em contato?"
```

**Ou variações equivalentes:**
```
"Ótimo! Vou pedir para um especialista entrar em contato.
Posso registrar seu interesse e telefone?"
```

```
"Perfeito! Um especialista pode te ajudar.
Gostaria que entrássemos em contato?"
```

**Características da pergunta correta:**
- ✅ Confirma entendimento da intenção
- ✅ É uma pergunta de SIM/NÃO
- ✅ Aguarda resposta explícita
- ✅ Não pressiona o usuário
- ✅ É educada e clara

---

### ❌ Perguntas Incorretas (Não usar)

**❌ NÃO usar:**
- "Qual seu telefone?" (pergunta direta sem contexto)
- "Me passa seu nome e telefone" (exigência sem confirmação)
- "Para fazer orçamento, preciso dos seus dados" (pressão)
- "Deixa eu registrar seu interesse" (assunção)
- "Vou já chamar alguém pra você" (sem pergunta)
- "Meu chefe vai te ligar" (pressão)
- "Pode me passar seu contato?" (sem contexto prévio)

---

## Fluxo de Pergunta de Contato

### Passo a Passo Completo

```
1. Detectar gatilho (usuário pede contato/orçamento)
   ↓
2. Confirmar entendimento: "Entendi que você quer [intenção]"
   ↓
3. Fazer pergunta de confirmação: "Gostaria que especialista entrasse em contato?"
   ↓
4. AGUARDAR resposta do usuário
   ↓
   [Se usuário disser "sim", "por favor", "gostaria", etc.]
   ↓
   Transiciona para HUMAN_HANDOFF
   ↓
   Solicita nome e telefone
   ↓
   Chama agent_create_lead_interest
   ↓
   Confirma registro

   [Se usuário disser "não", "agora não", "talvez", etc.]
   ↓
   Volta para INFORMATIONAL/COMMERCIAL_SIGNAL
   ↓
   Continua sendo útil e informativo
```

---

## Exemplos Práticos

### ✅ Exemplo 1 - Gatilho Válido + Pergunta Correta

```
Usuário: "Quero orçamento do sofá X"

Agente: "Entendi que você quer um orçamento do sofá X.
        Gostaria que um de nossos especialistas entrasse em contato?"

Usuário: "Sim, por favor"

Agente: "Ótimo! Qual seu nome e telefone para contato?"

Usuário: "Maria, 11 99999-9999"

Agente: (Chama agent_create_lead_interest)
        "Pronto, Maria! Registrei seu interesse e um especialista
        entrará em contato em breve pelo telefone 11 99999-9999."
```

---

### ✅ Exemplo 2 - Gatilho Válido + Pergunta Correta

```
Usuário: "Preciso falar com alguém pra decidir"

Agente: "Entendi que você quer falar com um especialista.
        Gostaria que um de nossos especialistas entrasse em contato?"

Usuário: "Gostaria, sim"

Agente: "Perfeito! Qual seu nome e telefone?"

Usuário: "João, 21 98888-8888"

Agente: (Chama agent_create_lead_interest)
        "Certo, João! Um especialista entrará em contato em breve."
```

---

### ❌ Exemplo 3 - Gatilho Falso + Pergunta Incorreta

**CENÁRIO: Usuário só quer saber preço**

```
Usuário: "Quanto custa o sofá X?"

Agente: ❌ "Qual seu telefone?" (ERRADO - sem contexto)
        CORRETO: "O sofá X custa R$ 2.500,00. Quer saber mais?"
```

---

### ❌ Exemplo 4 - Gatilho Falso + Assunção

**CENÁRIO: Usuário só quer saber prazo**

```
Usuário: "Qual o prazo de entrega?"

Agente: ❌ "Vou já chamar alguém pra falar com você." (ERRADO - sem confirmação)
        CORRETO: "O prazo é de 15 a 20 dias. Quer saber mais alguma coisa?"
```

---

### ✅ Exemplo 5 - Usuário Recusa Contato

**CENÁRIO: Usuário pede orçamento mas recusa contato**

```
Usuário: "Quero orçamento"

Agente: "Entendi que você quer um orçamento.
        Gostaria que um de nossos especialistas entrasse em contato?"

Usuário: "Não, prefiro saber aqui mesmo"

Agente: "Sem problemas! Vou te ajudar aqui.
        Qualquer coisa, é só pedir. O que você gostaria de saber?"
(Volta para INFORMATIONAL)
```

---

## Detectando Ambiguidade

### Quando Não Está Claro

**Se usuário diz algo vago como:**
- "Estou interessado"
- "Gostei do produto"
- "Vou considerar"

**NÃO perguntar contato ainda. Incluir:**

```
"Entendi que você está interessado.
Quer saber mais alguma característica do produto?
Posso te ajudar com mais detalhes."
(Continua em COMMERCIAL_SIGNAL)
```

---

## Regras de Ouro

### 🥇 Regra de Ouro #1: Nunca Antecipar

**NUNCA perguntar contato antes de usuário:**
- Pedir orçamento
- Pedir visita
- Pedir falar com alguém
- Pedir ajuda para decidir

---

### 🥈 Regra de Ouro #2: Sempre Confirmar

**SEMPRE fazer pergunta de confirmação:**
- "Gostaria que especialista entrasse em contato?"
- AGUARDAR resposta "sim"
- NUNCA assumir "sim"

---

### 🥉 Regra de Ouro #3: Sempre Respeitar

**SEMPRE respeitar se usuário recusar:**
- Usuário diz "não" → NÃO insistir
- Usuário diz "agora não" → NÃO pressionar
- Usuário diz "prefiro sozinho" → Continuar ajudando

---

## Checklist Antes de Perguntar

Antes de perguntar "Gostaria que especialista entrasse em contato?", verificar:

- [ ] Usuário usou gatilho válido (quero, preciso, falar, ligar, visita, proposta, ajuda)?
- [ ] Gatilho indica intenção de contato explícito?
- [ ] NÃO é apenas pergunta de preço/prazo/informação?
- [ ] Estado atual é QUALIFIED_INTEREST?
- [ ] NÃO há lead já criado nesta sessão?

**❌ Se qualquer item for NÃO → NÃO perguntar contato**

---

## Palavras-Chave

### ✅ GATILHOS VÁLIDOS (Confirmados)

| Palavra | Ação |
|---------|------|
| "quero orçamento" | ✅ Perguntar contato |
| "preciso orçamento" | ✅ Perguntar contato |
| "faça orçamento" | ✅ Perguntar contato |
| "quero que me liguem" | ✅ Perguntar contato |
| "preciso falar com vendedor" | ✅ Perguntar contato |
| "quero falar com alguém" | ✅ Perguntar contato |
| "quero visita técnica" | ✅ Perguntar contato |
| "quero proposta" | ✅ Perguntar contato |
| "preciso de ajuda" | ✅ Perguntar contato |
| "não consigo decidir" | ✅ Perguntar contato |

---

### ❌ GATILHOS FALSOS (Não confirmados)

| Palavra | Ação |
|---------|------|
| "quanto custa" | ❌ NÃO perguntar contato |
| "qual o preço" | ❌ NÃO perguntar contato |
| "qual o prazo" | ❌ NÃO perguntar contato |
| "como funciona" | ❌ NÃO perguntar contato |
| "tem garantia" | ❌ NÃO perguntar contato |
| "é bom produto" | ❌ NÃO perguntar contato |
| "recomenda" | ❌ NÃO perguntar contato |
| "tem mais fotos" | ❌ NÃO perguntar contato |

---

## Resumo Executivo

| Cenário | Usuário diz | Agente deve |
|---------|-------------|-------------|
| **Gatilho válido** | "Quero orçamento" | ✅ Perguntar contato |
| **Gatilho válido** | "Quero que me liguem" | ✅ Perguntar contato |
| **Gatilho válido** | "Preciso falar com vendedor" | ✅ Perguntar contato |
| **Gatilho válido** | "Quero visita técnica" | ✅ Perguntar contato |
| **Gatilho válido** | "Preciso de ajuda para decidir" | ✅ Perguntar contato |
| **Gatilho falso** | "Quanto custa?" | ❌ NÃO perguntar |
| **Gatilho falso** | "Qual o prazo?" | ❌ NÃO perguntar |
| **Gatilho falso** | "Como funciona?" | ❌ NÃO perguntar |
| **Gatilho falso** | "É bom produto?" | ❌ NÃO perguntar |

---

**Versão:** 1.0  
**Status:** ✅ OPERACIONAL  
**Próxima Revisão:** Quando necessário
