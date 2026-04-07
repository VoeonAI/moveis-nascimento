# Exemplos Corretos - Conversas que Geram Lead

**Versão:** 1.0  
**Data:** 2025-01-06  
**Status:** ✅ OPERACIONAL  
**Objetivo:** Mostrar exemplos de conversas que geram lead CORRETAMENTE

---

## Princípio Fundamental

**✅ CORRETO:**
- Usuário pede contato/orçamento EXPLICITAMENTE
- Agente confirma intenção antes de registrar
- Usuário confirma com "sim", "por favor", etc.
- Lead é registrado no estado HUMAN_HANDOFF
- Uma gravação por avanço comercial relevante

---

## Exemplo 1 - Pedido de Orçamento

```
─────────────────────────────────────────────────────────────
CONVERSA: Pedido de Orçamento
─────────────────────────────────────────────────────────────

Usuário: Olá! Quero um orçamento de sofá.

[ESTADO: INFORMATIONAL → DETECTA "orçamento" → QUALIFIED_INTEREST]

Agente: Olá! Qual tipo de sofá você está buscando?
        Temos modelos de 2, 3 e 4 lugares, em vários materiais.

Usuário: Quero um de 3 lugares, couro, preto.

[ESTADO: QUALIFIED_INTEREST]

Agente: Perfeito! Vou buscar modelos de sofá 3 lugares em couro preto.
        Aqui estão algumas opções:
        - Sofá Modelo X: R$ 2.500,00, couro sintético
        - Sofá Modelo Y: R$ 3.200,00, couro legítimo
        - Sofá Modelo Z: R$ 4.800,00, couro premium

        Alguns desses te interessam?

Usuário: O Modelo Y parece bom. Quero orçamento dele.

[ESTADO: QUALIFIED_INTEREST]

Agente: Entendi que você quer um orçamento do Modelo Y.
        Gostaria que um de nossos especialistas entrasse em contato?

Usuário: Sim, por favor.

[ESTADO: HUMAN_HANDOFF]

Agente: Ótimo! Qual seu nome e telefone para contato?

Usuário: João Silva, 11 99999-9999

[CALL: agent_create_lead_interest]
{
  "customer_name": "João Silva",
  "customer_phone": "11999999999",
  "message": "Cliente interessado em sofá Modelo Y (3 lugares, couro preto, R$ 3.200,00)",
  "source": "n8n",
  "context": {
    "intent": "human_handoff",
    "product_id": "uuid-do-modelo-y",
    "product_name": "Sofá Modelo Y",
    "category_slug": "sofas"
  }
}

Agente: Pronto, João! Registrei seu interesse e um especialista
        entrará em contato em breve pelo telefone 11 99999-9999.

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✓ Usuário pediu orçamento EXPLICITAMENTE
✓ Agente confirmou intenção
✓ Usuário confirmou COM SIM
✓ Lead registrado NO ESTADO HUMAN_HANDOFF
✓ Uma gravação por avanço comercial
```

---

## Exemplo 2 - Pedido de Contato

```
─────────────────────────────────────────────────────────────
CONVERSA: Pedido de Contato
─────────────────────────────────────────────────────────────

Usuário: Estou vendo a cadeira de escritório.

[ESTADO: INFORMATIONAL]

Agente: Olá! Sim, temos excelentes opções de cadeiras de escritório.
        Qual característica é mais importante para você?
        Ergonomia, design, preço, material?

Usuário: Preciso de algo ergonômico para home office.

[ESTADO: INFORMATIONAL]

Agente: Ótimo! Cadeiras ergonômicas são essenciais para quem trabalha muito.
        Aqui estão nossas opções mais ergonômicas:
        - Cadeira Modelo A: R$ 800,00, suporte lombar ajustável
        - Cadeira Modelo B: R$ 1.200,00, suporte lombar + braços ajustáveis
        - Cadeira Modelo C: R$ 1.800,00, full ergonômica com 10 ajustes

        Qual modelo te chama atenção?

Usuário: O Modelo B parece bom. Quanto custa?

[ESTADO: COMMERCIAL_SIGNAL]

Agente: A Cadeira Modelo B custa R$ 1.200,00.
        Inclui: suporte lombar ajustável, braços reguláveis,
                 rotação 360°, garantia de 2 anos.
        Prazo de entrega: 15 a 20 dias.

        Quer saber mais alguma coisa?

Usuário: Quero falar com alguém antes de comprar.

[ESTADO: QUALIFIED_INTEREST]

Agente: Entendi que você quer falar com um especialista.
        Gostaria que um de nossos especialistas entrasse em contato?

Usuário: Gostaria, sim.

[ESTADO: HUMAN_HANDOFF]

Agente: Perfeito! Qual seu nome e telefone?

Usuário: Maria Santos, 21 98888-8888

[CALL: agent_create_lead_interest]
{
  "customer_name": "Maria Santos",
  "customer_phone": "21988888888",
  "message": "Cliente interessada em Cadeira Modelo B (ergonômica, R$ 1.200,00). Quer falar com especialista antes de comprar.",
  "source": "n8n",
  "context": {
    "intent": "human_handoff",
    "product_id": "uuid-do-modelo-b",
    "product_name": "Cadeira Modelo B",
    "category_slug": "cadeiras-escritorio"
  }
}

Agente: Certo, Maria! Um especialista entrará em contato em breve
        pelo telefone 21 98888-8888.

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✓ Usuário pediu falar com alguém EXPLICITAMENTE
✓ Agente confirmou intenção
✓ Usuário confirmou COM SIM
✓ Lead registrado NO ESTADO HUMAN_HANDOFF
✓ Uma gravação por avanço comercial
```

---

## Exemplo 3 - Pedido de Visita Técnica

```
─────────────────────────────────────────────────────────────
CONVERSA: Pedido de Visita Técnica
─────────────────────────────────────────────────────────────

Usuário: Preciso de um guarda-roupa planejado.

[ESTADO: INFORMATIONAL]

Agente: Olá! Guarda-roupas planejados são ótimos para otimizar espaço.
        Você já tem o espaço disponível? Qual o tamanho aproximado?

Usuário: É um quarto de 3m x 3m, quero aproveitar a parede toda.

[ESTADO: INFORMATIONAL]

Agente: Perfeito! Uma parede de 3m permite um guarda-roupa bem espaçoso.
        Oferecemos diversos modelos:
        - Modelo Compacto: 2m de largura, 3 portas, R$ 3.500,00
        - Modelo Standard: 2,5m de largura, 4 portas, R$ 4.500,00
        - Modelo Premium: 3m de largura, 6 portas, R$ 6.500,00

        Qual modelo te interessa?

Usuário: O Standard parece bom. Preciso de visita técnica para medir.

[ESTADO: QUALIFIED_INTEREST]

Agente: Entendi que você precisa de visita técnica para o Modelo Standard.
        Gostaria que um especialista fosse até você?

Usuário: Quero que alguém venha medir, sim.

[ESTADO: HUMAN_HANDOFF]

Agente: Ótimo! Qual seu nome e telefone para agendar visita?

Usuário: Pedro Lima, 31 97777-7777

[CALL: agent_create_lead_interest]
{
  "customer_name": "Pedro Lima",
  "customer_phone": "31977777777",
  "message": "Cliente interessado em Guarda-roupa Modelo Standard (2,5m, 4 portas, R$ 4.500,00). Precisa de visita técnica para medição.",
  "source": "n8n",
  "context": {
    "intent": "human_handoff",
    "product_id": "uuid-do-modelo-standard",
    "product_name": "Guarda-roupa Modelo Standard",
    "category_slug": "guarda-roupas-planejados"
  }
}

Agente: Pronto, Pedro! Registrei sua necessidade de visita técnica.
        Um especialista entrará em contato em breve pelo telefone 31 97777-7777.

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✓ Usuário pediu visita técnica EXPLICITAMENTE
✓ Agente confirmou intenção
✓ Usuário confirmou COM SIM
✓ Lead registrado NO ESTADO HUMAN_HANDOFF
✓ Uma gravação por avanço comercial
```

---

## Exemplo 4 - Pedido de Proposta Comercial

```
─────────────────────────────────────────────────────────────
CONVERSA: Pedido de Proposta Comercial
─────────────────────────────────────────────────────────────

Usuário: Estou precisando mobiliar um escritório inteiro.

[ESTADO: INFORMATIONAL]

Agente: Olá! Mobiliamento de escritório é um projeto importante.
        Qual o tamanho do escritório? Quantas pessoas trabalharão lá?

Usuário: São 50 funcionários, espaço de 200m².

[ESTADO: INFORMATIONAL]

Agente: Excelente! Para 50 funcionários em 200m², precisamos de um projeto
        completo. Temos experiências com projetos corporativos de todos os
        tamanhos.

        Oferecemos:
        - Projetos completos (mesas, cadeiras, armários, recepção)
        - Atendimento personalizado com especialista
        - Propostas comerciais competitivas
        - Instalação e montagem

        Você gostaria de uma proposta comercial completa?

Usuário: Quero proposta comercial sim, é para empresa.

[ESTADO: QUALIFIED_INTEREST]

Agente: Entendi que você precisa de uma proposta comercial completa
        para mobiliamento de escritório (50 funcionários, 200m²).
        Gostaria que um especialista entrasse em contato?

Usuário: Pode entrar em contato, sim.

[ESTADO: HUMAN_HANDOFF]

Agente: Perfeito! Qual seu nome, empresa e telefone?

Usuário: Roberto Almeida, ABC Soluções, 41 96666-6666

[CALL: agent_create_lead_interest]
{
  "customer_name": "Roberto Almeida",
  "customer_phone": "41966666666",
  "message": "Cliente interessado em proposta comercial para mobiliamento de escritório completo (50 funcionários, 200m², empresa ABC Soluções).",
  "source": "n8n",
  "context": {
    "intent": "human_handoff",
    "project_type": "office_furniture",
    "employees": 50,
    "area": "200m²",
    "company": "ABC Soluções"
  }
}

Agente: Certo, Roberto! Um especialista entrará em contato com você
        em breve para elaborar a proposta comercial para a ABC Soluções.
        Telefone: 41 96666-6666.

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✓ Usuário pediu proposta comercial EXPLICITAMENTE
✓ Agente confirmou intenção
✓ Usuário confirmou COM SIM
✓ Lead registrado NO ESTADO HUMAN_HANDOFF
✓ Uma gravação por avanço comercial
```

---

## Exemplo 5 - Pedido de Ajuda para Decisão

```
─────────────────────────────────────────────────────────────
CONVERSA: Pedido de Ajuda para Decisão
─────────────────────────────────────────────────────────────

Usuário: Estou com dúvida entre dois sofás.

[ESTADO: INFORMATIONAL]

Agente: Olá! Dúvidas são normais, vamos te ajudar!
        Quais os dois modelos que você está considerando?

Usuário: O Sofá Modelo X (R$ 2.500) e o Sofá Modelo Y (R$ 3.200).

[ESTADO: INFORMATIONAL]

Agente: Ótimo escolha! Vou te mostrar as diferenças principais:

        **Sofá Modelo X (R$ 2.500):**
        - Couro sintético
        - 3 lugares
        - Cor: Cinza
        - Garantia: 2 anos

        **Sofá Modelo Y (R$ 3.200):**
        - Couro legítimo
        - 3 lugares
        - Cor: Preto
        - Garantia: 3 anos
        - Braços removíveis

        A principal diferença é o material e os braços removíveis.

        Qual aspecto é mais importante para você?

Usuário: Difícil decidir. Preciso de ajuda.

[ESTADO: QUALIFIED_INTEREST]

Agente: Entendi que está difícil decidir entre os dois modelos.
        Gostaria que um especialista te ajudasse na escolha?

Usuário: Quero falar com especialista, sim.

[ESTADO: HUMAN_HANDOFF]

Agente: Perfeito! Qual seu nome e telefone?

Usuário: Ana Costa, 11 95555-5555

[CALL: agent_create_lead_interest]
{
  "customer_name": "Ana Costa",
  "customer_phone": "11955555555",
  "message": "Cliente com dúvida entre Sofá Modelo X (R$ 2.500, couro sintético) e Sofá Modelo Y (R$ 3.200, couro legítimo). Precisa de ajuda para decisão.",
  "source": "n8n",
  "context": {
    "intent": "human_handoff",
    "products": ["uuid-modelo-x", "uuid-modelo-y"],
    "product_names": ["Sofá Modelo X", "Sofá Modelo Y"]
  }
}

Agente: Certo, Ana! Um especialista entrará em contato em breve
        para te ajudar na escolha entre os modelos.
        Telefone: 11 95555-5555.

─────────────────────────────────────────────────────────────
ANÁLISE: ✅ CORRETO
─────────────────────────────────────────────────────────────
✓ Usuário pediu ajuda para decisão EXPLICITAMENTE
✓ Agente confirmou intenção
✓ Usuário confirmou COM SIM
✓ Lead registrado NO ESTADO HUMAN_HANDOFF
✓ Uma gravação por avanço comercial
```

---

## Resumo dos Exemplos Corretos

| Exemplo | Gatilho | Confirmação | Estado | Resultado |
|---------|---------|-------------|--------|-----------|
| 1 - Orçamento | "Quero orçamento" | "Sim, por favor" | HUMAN_HANDOFF | ✅ Lead criado |
| 2 - Contato | "Quero falar com alguém" | "Gostaria, sim" | HUMAN_HANDOFF | ✅ Lead criado |
| 3 - Visita | "Preciso de visita técnica" | "Quero que alguém venha medir, sim" | HUMAN_HANDOFF | ✅ Lead criado |
| 4 - Proposta | "Quero proposta comercial" | "Pode entrar em contato, sim" | HUMAN_HANDOFF | ✅ Lead criado |
| 5 - Ajuda | "Preciso de ajuda" | "Quero falar com especialista, sim" | HUMAN_HANDOFF | ✅ Lead criado |

---

## Padrões Comuns nos Exemplos Corretos

### ✅ Padrão 1: Gatilho Explícito
- "Quero orçamento"
- "Quero falar com alguém"
- "Preciso de visita técnica"
- "Quero proposta comercial"
- "Preciso de ajuda"

### ✅ Padrão 2: Confirmação do Agente
- "Gostaria que um especialista entrasse em contato?"
- "Gostaria que um de nossos especialistas entrasse em contato?"
- "Gostaria que um especialista fosse até você?"

### ✅ Padrão 3: Confirmação do Usuário
- "Sim, por favor"
- "Gostaria, sim"
- "Quero que alguém venha medir, sim"
- "Pode entrar em contato, sim"
- "Quero falar com especialista, sim"

### ✅ Padrão 4: Registro no Estado HUMAN_HANDOFF
- Após confirmação explícita do usuário
- Com nome e telefone fornecidos
- Com mensagem/contexto claro

---

**Versão:** 1.0  
**Status:** ✅ OPERACIONAL  
**Próxima Revisão:** Quando necessário
