# Exemplos Incorretos - Conversas que NÃO Devem Gerar Lead

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ OPERACIONAL  
**Objetivo:** Mostrar exemplos de conversas que NÃO geram lead e explicar por que

---

## Princípio Fundamental

**❌ INCORRETO:**
- Usuário apenas buscando informações
- Usuário com curiosidade sobre produtos
- Usuário navegando pelo catálogo
- Usuário perguntando preço/prazo (sem pedido de contato)
- Usuário comparando produtos
- Usuário sem intenção clara de compra

**✅ CORRETO:**
- Usuário pede contato/orçamento EXPLICITAMENTE
- Agente confirma antes de registrar
- Lead é registrado NO ESTADO HUMAN_HANDOFF

---

## Exemplo 1 - Apenas Pergunta de Preço

```
─────────────────────────────────────────────────────────────
CONVERSA: Apenas Pergunta de Preço
─────────────────────────────────────────────────────────────

Usuário: Quanto custa o sofá Modelo X?

[ESTADO: INFORMATIONAL → DETECTA "quanto custa" → INFORMATIONAL/COMMERCIAL_SIGNAL]

Agente ❌ ERRADO: "Qual seu telefone? Um vendedor vai te ligar."

Agente ✅ CORRETO: "O sofá Modelo X custa R$ 2.500,00.
                     Quer saber mais alguma característica?"

─────────────────────────────────────────────────────────────
ANÁLISE: ❌ INCORRETO
─────────────────────────────────────────────────────────────
❌ Usuário não pediu contato
❌ Usuário não pediu orçamento
❌ Usuário apenas perguntou preço
❌ Estado deve ser INFORMATIONAL/COMMERCIAL_SIGNAL
❌ NÃO deve pedir contato
❌ NÃO deve registrar lead
```

---

## Exemplo 2 - Apenas Pergunta de Prazo

```
─────────────────────────────────────────────────────────────
CONVERSA: Apenas Pergunta de Prazo
─────────────────────────────────────────────────────────────

Usuário: Qual o prazo de entrega do guarda-roupa?

[ESTADO: INFORMATIONAL → DETECTA "prazo" → INFORMATIONAL/COMMERCIAL_SIGNAL]

Agente ❌ ERRADO: "Vou registrar seu interesse. Qual seu telefone?"

Agente ✅ CORRETO: "O prazo de entrega é de 15 a 20 dias úteis.
                     Quer saber mais alguma coisa?"

─────────────────────────────────────────────────────────────
ANÁLISE: ❌ INCORRETO
─────────────────────────────────────────────────────────────
❌ Usuário não pediu contato
❌ Usuário não pediu orçamento
❌ Usuário apenas perguntou prazo
❌ Estado deve ser INFORMATIONAL/COMMERCIAL_SIGNAL
❌ NÃO deve pedir contato
❌ NÃO deve registrar lead
```

---

## Exemplo 3 - Navegação pelo Catálogo

```
─────────────────────────────────────────────────────────────
CONVERSA: Navegação pelo Catálogo
─────────────────────────────────────────────────────────────

Usuário: Tem sofá de couro?

[ESTADO: INFORMATIONAL]

Agente ✅ CORRETO: "Sim! Temos várias opções de sofás em couro.
                     Aqui estão alguns modelos:
                     - Sofá Modelo A: R$ 2.000,00
                     - Sofá Modelo B: R$ 2.800,00
                     - Sofá Modelo C: R$ 3.500,00
                     
                     Qual modelo te interessa?"

Usuário: Mostre o Modelo A.

Agente ✅ CORRETO: "O Sofá Modelo A tem:
                     - 3 lugares
                     - Couro sintético preto
                     - 180cm de largura
                     - Garantia de 2 anos
                     
                     Quer saber mais alguma coisa?"

[ESTADO: INFORMATIONAL - NÃO transiciona para QUALIFIED_INTEREST]

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✅ Usuário apenas navegando pelo catálogo
✅ Usuário sem intenção clara de compra
✅ Estado permanece INFORMATIONAL
✅ NÃO pediu contato
✅ NÃO deve registrar lead
```

---

## Exemplo 4 - Comparação de Produtos

```
─────────────────────────────────────────────────────────────
CONVERSA: Comparação de Produtos
─────────────────────────────────────────────────────────────

Usuário: Qual a diferença entre o sofá Modelo X e o Modelo Y?

[ESTADO: INFORMATIONAL]

Agente ✅ CORRETO: "Vou te mostrar as diferenças principais:
                     
                     **Sofá Modelo X (R$ 2.500):**
                     - Couro sintético
                     - 3 lugares
                     - Garantia: 2 anos
                     
                     **Sofá Modelo Y (R$ 3.200):**
                     - Couro legítimo
                     - 3 lugares
                     - Garantia: 3 anos
                     - Braços removíveis
                     
                     A principal diferença é o material e os braços removíveis.
                     Qual aspecto é mais importante para você?"

Usuário: É difícil escolher. Vale a pena pagar mais pelo Modelo Y?

Agente ✅ CORRETO: "O Modelo Y tem couro legítimo e braços removíveis,
                     o que oferece maior durabilidade e versatilidade.
                     Mas se o couro sintético do Modelo X atender suas necessidades,
                     pode ser uma opção mais econômica.
                     
                     Depende do seu orçamento e uso pretendido.
                     Quer saber mais alguma coisa?"

[ESTADO: INFORMATIONAL/COMMERCIAL_SIGNAL - NÃO transiciona para QUALIFIED_INTEREST]

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✅ Usuário apenas comparando produtos
✅ Usuário em dúvida, sem intenção clara
✅ Estado permanece INFORMATIONAL/COMMERCIAL_SIGNAL
✅ NÃO pediu contato
✅ NÃO deve registrar lead
```

---

## Exemplo 5 - Curiosidade Sobre Produto

```
─────────────────────────────────────────────────────────────
CONVERSA: Curiosidade Sobre Produto
─────────────────────────────────────────────────────────────

Usuário: Como funciona o mecanismo do guarda-roupa deslizante?

[ESTADO: INFORMATIONAL]

Agente ✅ CORRETO: "O mecanismo deslizante do guarda-roupa utiliza
                     trilhos de alta resistência e roletas metálicas,
                     permitindo deslizar as portas suavemente.
                     
                     Inclui sistema de amortecimento para fechamento
                     suave e silencioso. Durabilidade estimada: 10 anos.
                     
                     Quer saber mais alguma característica?"

Usuário: Tem em branco?

Agente ✅ CORRETO: "Sim! Temos o modelo em branco fosco e branco brilhante.
                     Qual prefere?"

[ESTADO: INFORMATIONAL - NÃO transiciona para QUALIFIED_INTEREST]

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✅ Usuário apenas com curiosidade técnica
✅ Usuário sem intenção de compra
✅ Estado permanece INFORMATIONAL
✅ NÃO pediu contato
✅ NÃO deve registrar lead
```

---

## Exemplo 6 - Usuário Recusa Contato

```
─────────────────────────────────────────────────────────────
CONVERSA: Usuário Recusa Contato
─────────────────────────────────────────────────────────────

Usuário: Quero orçamento do sofá Modelo X.

[ESTADO: INFORMATIONAL → DETECTA "orçamento" → QUALIFIED_INTEREST]

Agente ✅ CORRETO: "Entendi que você quer um orçamento do Modelo X.
                     Gostaria que um de nossos especialistas entrasse em contato?"

Usuário: Não, prefiro saber aqui mesmo.

[ESTADO: QUALIFIED_INTEREST → Resposta NÃO → INFORMATIONAL]

Agente ✅ CORRETO: "Sem problemas! Vou te ajudar aqui.
                     Qualquer coisa, é só pedir. O que você gostaria de saber?"

Usuário: Qual o preço?

Agente ✅ CORRETO: "O sofá Modelo X custa R$ 2.500,00.
                     Quer saber mais alguma característica?"

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✅ Usuário pediu orçamento (gatilho válido)
✅ Agente confirmou intenção
✅ Usuário DISSE NÃO
✅ Estado voltou para INFORMATIONAL
✅ NÃO foi registrado lead
✅ Agente continuou ajudando
```

---

## Exemplo 7 - Primeira Interação

```
─────────────────────────────────────────────────────────────
CONVERSA: Primeira Interação - Apenas Olhando
─────────────────────────────────────────────────────────────

Usuário: Oi!

Agente ✅ CORRETO: "Olá! Como posso te ajudar hoje?
                     Estou aqui para responder suas perguntas sobre produtos."

Usuário: Estou só olhando, obrigado.

Agente ✅ CORRETO: "Sem problemas! Se tiver alguma pergunta sobre
                     nossos produtos, é só chamar. Estou à disposição!"

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✅ Usuário em primeira interação
✅ Usuário sem intenção clara
✅ Estado INFORMATIONAL
✅ NÃO pediu contato
✅ NÃO deve registrar lead
```

---

## Exemplo 8 - Pergunta Sobre Garantia

```
─────────────────────────────────────────────────────────────
CONVERSA: Pergunta Sobre Garantia
─────────────────────────────────────────────────────────────

Usuário: O sofá Modelo X tem garantia?

[ESTADO: INFORMATIONAL]

Agente ❌ ERRADO: "Vou registrar seu interesse. Qual seu telefone?"

Agente ✅ CORRETO: "Sim! O sofá Modelo X tem garantia de 2 anos para estrutura e
                     1 ano para estofagem. Cobre defeitos de fabricação.
                     
                     Quer saber mais alguma coisa?"

─────────────────────────────────────────────────────────────
ANÁLISE: ❌ INCORRETO
─────────────────────────────────────────────────────────────
❌ Usuário não pediu contato
❌ Usuário não pediu orçamento
❌ Usuário apenas perguntou sobre garantia
❌ Estado deve ser INFORMATIONAL
❌ NÃO deve pedir contato
❌ NÃO deve registrar lead
```

---

## Exemplo 9 - Tentativa Prematura de Registro

```
─────────────────────────────────────────────────────────────
CONVERSA: Tentativa Prematura de Registro
─────────────────────────────────────────────────────────────

Usuário: Preciso de um sofá para minha sala.

[ESTADO: INFORMATIONAL]

Agente ❌ ERRADO: "Vou já registrar seu interesse. Qual seu telefone?"
            [CALL: agent_create_lead_interest]
            
Agente ✅ CORRETO: "Entendi que você precisa de um sofá para a sala.
                     Qual o tamanho disponível? Quantos lugares precisa?
                     Tem preferência de material ou cor?"

Usuário: 3 lugares, couro, preto.

Agente ✅ CORRETO: "Perfeito! Vou buscar sofás 3 lugares em couro preto.
                     Aqui estão algumas opções:
                     - Sofá Modelo A: R$ 2.500,00
                     - Sofá Modelo B: R$ 3.200,00
                     
                     Qual te interessa?"

─────────────────────────────────────────────────────────────
ANÁLISE: ❌ INCORRETO (primeira tentativa) | ✅ CORRETO (segunda tentativa)
─────────────────────────────────────────────────────────────
❌ Usuário não pediu contato ou orçamento
❌ Usuário apenas expressou necessidade
❌ Estado deve ser INFORMATIONAL
❌ NÃO deve pedir contato prematuramente
❌ NÃO deve registrar lead sem confirmação

✅ CORRETO: Agente perguntou mais detalhes
✅ CORRETO: Agente ofereceu opções
✅ CORRETO: Estado permaneceu INFORMATIONAL
```

---

## Exemplo 10 - Usuário Já Tem Lead na Sessão

```
─────────────────────────────────────────────────────────────
CONVERSA: Usuário Já Tem Lead na Sessão
─────────────────────────────────────────────────────────────

Usuário: Quero orçamento do sofá Modelo X.

[ESTADO: QUALIFIED_INTEREST]

Agente ✅ CORRETO: "Entendi que você quer um orçamento do Modelo X.
                     Gostaria que um de nossos especialistas entrasse em contato?"

Usuário: Sim, por favor.

Agente ✅ CORRETO: "Ótimo! Qual seu nome e telefone?"

Usuário: João, 11 99999-9999.

[CALL: agent_create_lead_interest]
session.lead_created = true

Agente ✅ CORRETO: "Pronto, João! Registrei seu interesse e um especialista
                     entrará em contato em breve pelo telefone 11 99999-9999."

Usuário: Também quero orçamento do sofá Modelo Y.

[ESTADO: QUALIFIED_INTEREST, MAS session.lead_created = true]

Agente ❌ ERRADO: "Vou registrar seu interesse. Qual seu telefone?"
            [CALL: agent_create_lead_interest] ❌ DUPLICADO

Agente ✅ CORRETO: "Você já tem um interesse registrado sobre o sofá Modelo X!
                     Um especialista entrará em contato e pode te ajudar com
                     orçamentos adicionais.

                     Quer mais informações sobre o Modelo Y?"

─────────────────────────────────────────────────────────────
ANÁLISE: ❌ INCORRETO (primeira tentativa) | ✅ CORRETO (segunda tentativa)
─────────────────────────────────────────────────────────────
❌ Usuário já tem lead registrado na sessão
❌ NÃO deve duplicar lead
❌ session.lead_created = true deve ser respeitado
❌ NÃO deve chamar agent_create_lead_interest novamente

✅ CORRETO: Agente verificou lead_existente
✅ CORRETO: Agente confirmou lead já registrado
✅ CORRETO: Agente informou especialista pode ajudar com orçamentos adicionais
```

---

## Resumo dos Exemplos Incorretos

| Exemplo | Erro | Estado Correto | Ação Correta |
|---------|------|----------------|--------------|
| 1 - Preço | Pediu contato sem pedido | INFORMATIONAL | Responder preço |
| 2 - Prazo | Pediu contato sem pedido | INFORMATIONAL | Responder prazo |
| 3 - Catálogo | (não houve erro) | INFORMATIONAL | Continuar navegando |
| 4 - Comparação | (não houve erro) | INFORMATIONAL | Continuar comparando |
| 5 - Curiosidade | (não houve erro) | INFORMATIONAL | Responder pergunta |
| 6 - Recusa | (não houve erro) | INFORMATIONAL | Continuar ajudando |
| 7 - Primeira interação | (não houve erro) | INFORMATIONAL | Aguardar |
| 8 - Garantia | Pediu contato sem pedido | INFORMATIONAL | Responder garantia |
| 9 - Prematuro | Pediu contato sem pedido | INFORMATIONAL | Perguntar detalhes |
| 10 - Duplicação | Tentou duplicar lead | HUMAN_HANDOFF | Confirmar lead existente |

---

## Padrões Comuns nos Exemplos Incorretos

### ❌ Padrão 1: Pedir Contato sem Pedido
- Usuário: "Quanto custa?"
- Agente: "Qual seu telefone?" ❌

**Correto:**
- Usuário: "Quanto custa?"
- Agente: "O produto custa R$ X. Quer saber mais?" ✅

---

### ❌ Padrão 2: Assumir Intenção
- Usuário: "Preciso de um sofá"
- Agente: "Vou registrar seu interesse." ❌

**Correto:**
- Usuário: "Preciso de um sofá"
- Agente: "Entendi! Qual o tamanho? Quantos lugares?" ✅

---

### ❌ Padrão 3: Pular Confirmação
- Usuário: "Quero orçamento"
- Agente: "Vou já ligar pra você." ❌

**Correto:**
- Usuário: "Quero orçamento"
- Agente: "Gostaria que especialista entrasse em contato?" ✅

---

### ❌ Padrão 4: Duplicar Lead
- Usuário: "Também quero orçamento do Modelo Y"
- Agente: (cria novo lead) ❌

**Correto:**
- Usuário: "Também quero orçamento do Modelo Y"
- Agente: "Você já tem lead registrado. Especialista vai te ajudar." ✅

---

## Checklist Anti-Spam

Antes de chamar `agent_create_lead_interest`, verificar:

- [ ] Usuário pediu contato EXPLICITAMENTE?
- [ ] Usuário confirmou com "sim" ou equivalente?
- [ ] Estado atual é HUMAN_HANDOFF?
- [ ] session.lead_created = false?
- [ ] NÃO é apenas pergunta de preço/prazo?
- [ ] NÃO é apenas curiosidade?
- [ ] NÃO é navegação pelo catálogo?

**❌ Se qualquer item for NÃO → NÃO chamar função**

---

**Versão:** 1.0  
**Status:** ✅ OPERACIONAL  
**Próxima Revisão:** Quando necessário
