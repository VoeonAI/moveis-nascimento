# Regras de Disparo - agent_create_lead_interest

## Contexto
A função `agent_create_lead_interest` é uma **função WRITE** que afeta o CRM. Por isso, não deve ser chamada a cada sinal de interesse casual, mas sim apenas quando houver intenção clara de contato humano/comercial.

---

## ✅ SÓ CHAMAR quando:

1. **O usuário disser explicitamente que quer falar com um consultor, vendedor ou atendente**
   - "Quero falar com um vendedor"
   - "Pode me passar com um atendente?"
   - "Preciso falar com alguém da loja"

2. **O usuário aceitar uma oferta do agente para encaminhamento humano**
   - Agente: "Você quer que eu encaminhe seu interesse para um consultor?"
   - Usuário: "Sim" / "Quero" / "Pode encaminhar"

3. **O usuário pedir orçamento, negociação, fechamento ou retorno comercial**
   - "Quero um orçamento"
   - "Quero negociar o preço"
   - "Como faço pra fechar a compra?"
   - "Quero que alguém entre em contato pra negócio"

4. **O usuário pedir que alguém da loja entre em contato**
   - "Me liga?"
   - "Pode mandar alguém falar comigo?"
   - "Quero retorno comercial"

5. **O contexto indicar handoff humano explícito**
   - Qualquer outro sinal claro de que o usuário quer contato humano

---

## ❌ NÃO CHAMAR quando:

1. **O usuário estiver apenas perguntando sobre produtos**
   - "Quais produtos vocês têm?"
   - "Me fala mais sobre esse produto"
   - "O que inclui no sofá?"

2. **Estiver navegando catálogo**
   - Busca por categoria
   - Visualização de produtos
   - Navegação normal

3. **Estiver comparando opções**
   - "Qual é a diferença entre A e B?"
   - "Quero ver mais opções"
   - "Compare com outro modelo"

4. **Estiver pedindo descrição, preço, cor, medida ou disponibilidade**
   - "Qual é o preço?"
   - "Tem em qual cor?"
   - "Qual é a medida?"
   - "Tem em estoque?"

5. **Houver apenas interesse genérico sem pedido de contato**
   - "Gostei desse produto"
   - "É interessante"
   - "Vou considerar"

---

## 🤖 Comportamento Recomendado do Agente

### Fluxo Ideial:

```
1. Usuário: "Quanto custa o sofá?"
   Agente: [Responde usando READ products:read] "O sofá custa R$ 2.500,00..."

2. Usuário: "Quero falar com alguém pra negociar"
   Agente: [IDENTIFICA INTENÇÃO COMERCIAL]
   Agente: "Você quer que eu encaminhe seu interesse para um consultor?"

3. Usuário: "Sim"
   Agente: [CHAMA agent_create_lead_interest com human_handoff]
   Agente: "Perfeito! Um consultor vai entrar em contato em breve."
```

### Comportamento:

1. **Primeiro responder normalmente usando READ**
   - Usar `products:read` para responder dúvidas de produto
   - Usar `products_search` para busca
   - Usar `product_by_id` para detalhes

2. **Quando identificar intenção comercial real, perguntar:**
   - "Você quer que eu encaminhe seu interesse para um consultor?"
   - "Gostaria que um vendedor entrasse em contato?"

3. **Só chamar a função se a resposta for positiva**
   - Se "Sim" / "Quero" / "Pode encaminhar" → Chama `agent_create_lead_interest`
   - Se "Não" / "Ainda não" / "Quero só ver" → Não chama

---

## 🎯 Intent Recomendado

### `human_handoff`
Usar quando:
- Houver aceite explícito de contato humano
- O usuário pedir falar com alguém
- O usuário pedir retorno comercial

```json
{
  "intent": "human_handoff"
}
```

### `catalog_interest`
Usar apenas se:
- A regra do projeto considerar isso um lead legítimo
- Houver alinhamento com a equipe comercial sobre esse tipo de lead

```json
{
  "intent": "catalog_interest"
}
```

### `custom`
Usar para casos específicos não cobertos pelos intents acima.

---

## ⚠️ Em Caso de Dúvida

**NÃO ESCREVER NO CRM.**

- É melhor ter menos leads mais qualificados do que muito ruído
- O usuário pode sempre voltar e pedir contato depois
- Leads de baixa qualidade geram mais trabalho que valor

---

## 📊 Impacto esperado:

- ✅ **Menos ruído no CRM**
- ✅ **Leads mais qualificados**
- ✅ **Função WRITE usada apenas em momento certo**
- ✅ **Preservação da experiência do usuário**

---

## 🔧 Implementação no n8n

### Etapa 1: Identificação de Intenção
Antes de chamar a função, o n8n deve analisar a mensagem do usuário e verificar se há algum dos sinais de intenção comercial listados acima.

### Etapa 2: Confirmação
Se houver sinal de intenção, o agente deve perguntar ao usuário se ele quer encaminhamento humano.

### Etapa 3: Execução
Só chamar `agent_create_lead_interest` se o usuário confirmar positivamente.

### Etapa 4: Feedback
Informar o usuário que um consultor entrará em contato.

---

## 📝 Exemplos Práticos

### Exemplo 1: Não chamar - Dúvida de produto
```
Usuário: "Qual é a medida do sofá?"
Agente: [Usa product_by_id] "O sofá tem 2,5m de largura e 0,9m de profundidade."
```
❌ Não chama `agent_create_lead_interest`

### Exemplo 2: Não chamar - Interesse genérico
```
Usuário: "Gostei desse sofá."
Agente: "Ótimo! É um sofá de ótima qualidade. Tem mais alguma dúvida?"
```
❌ Não chama `agent_create_lead_interest`

### Exemplo 3: Chamar - Pedido explícito
```
Usuário: "Quero falar com um vendedor."
Agente: "Você quer que eu encaminhe seu interesse para um consultor?"
Usuário: "Sim"
Agente: [Chama agent_create_lead_interest com human_handoff]
Agente: "Perfeito! Um consultor vai entrar em contato em breve."
```
✅ Chama `agent_create_lead_interest`

### Exemplo 4: Chamar - Pedido de orçamento
```
Usuário: "Quero um orçamento desse sofá."
Agente: "Você quer que eu encaminhe seu interesse para um consultor?"
Usuário: "Pode encaminhar"
Agente: [Chama agent_create_lead_interest com human_handoff]
Agente: "Certo! Um consultor vai entrar em contato para fazer o orçamento."
```
✅ Chama `agent_create_lead_interest`

### Exemplo 5: Não chamar - Apenas visualização
```
Usuário: "Mostra mais produtos de sala"
Agente: [Usa products_search com category=sala] "Aqui estão os produtos de sala..."
```
❌ Não chama `agent_create_lead_interest`

---

## 🔗 Documentação Relacionada

- [Edge Function Documentation](./AGENT_CREATE_LEAD_INTEREST.md)
- [Token e Autenticação](./AGENT_CREATE_LEAD_INTEREST.md#autenticação)
