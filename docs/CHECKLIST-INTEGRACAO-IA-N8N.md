# Checklist Operacional - Integracao IA e n8n

Use este checklist antes de colocar ou alterar um fluxo de agente IA no n8n. Ele foca no que ja existe no projeto, sem exigir mudanca de banco ou deploy novo.

## 1. Preparacao

- [ ] Confirmar URL base: `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`
- [ ] Confirmar que o token existe em `agent_tokens`.
- [ ] Confirmar `active = true` no token.
- [ ] Confirmar que o n8n envia o header `x-agent-token`.
- [ ] Confirmar que o token possui apenas os scopes necessarios para o fluxo.
- [ ] Confirmar que o workflow trata erro por `ok === false`.
- [ ] Confirmar que endpoints de produtos tambem tratam HTTP `400`, `401`, `403`, `404` e `500`.

## 2. Scopes por fluxo

| Fluxo | Scopes minimos |
|-------|----------------|
| Buscar produtos | `products:read` |
| Ver detalhes publicos de produto | `products:read` |
| Ver preco/estoque/dados privados | `products:read`, `products:read_private` |
| Criar lead simples | `leads:write` |
| Registrar interesse em conversa | `leads:write` |
| Adicionar nota no lead | `leads:write` |
| Atualizar status do lead | `leads:update` |
| Rastrear pedido por telefone | `orders:read` |
| Consultar status de pedido | `orders:read` |
| Buscar montadores | `leads:read` ou `products:read` |

## 3. Fluxo recomendado para conversa comercial

- [ ] Buscar produtos com `agent_products_search`.
- [ ] Se o cliente escolher produto, buscar detalhes com `agent_product_by_id`.
- [ ] Se houver intencao de compra, chamar `agent_create_lead_interest`.
- [ ] Salvar `lead_id` retornado no contexto da conversa.
- [ ] Registrar observacoes importantes com `agent_add_lead_note`.
- [ ] Quando precisar de humano, chamar `agent_update_lead_status` com `talking_human`.

Payload recomendado para interesse:

```json
{
  "customer_name": "Nome do cliente",
  "customer_phone": "11999999999",
  "message": "Resumo do interesse do cliente",
  "source": "n8n",
  "context": {
    "intent": "catalog_interest",
    "product_id": "uuid-do-produto",
    "product_name": "Nome do produto",
    "category_slug": "slug-da-categoria"
  }
}
```

## 4. Fluxo recomendado para rastreio

- [ ] Pedir telefone do cliente.
- [ ] Chamar `agent_find_recent_orders_by_phone?phone={PHONE}`.
- [ ] Se `count > 0`, oferecer os pedidos encontrados.
- [ ] Chamar `agent_get_order_status?order_id={ORDER_ID}` para o pedido escolhido.
- [ ] Responder usando `order.label` como status amigavel.

Validacoes obrigatorias:

- [ ] Telefone com mascara: `(11) 99999-9999`.
- [ ] Telefone sem mascara: `11999999999`.
- [ ] Telefone com DDI: `+55 11 99999-9999`.
- [ ] Telefone sem pedidos deve retornar `orders: []`.

## 5. Webhooks para n8n

Para testar um endpoint de webhook pelo painel, o app agora chama `webhooks_dispatch` com:

```json
{
  "endpointId": "uuid-do-endpoint",
  "envelope": {
    "version": "1.0",
    "event_type": "webhook.test",
    "event_id": "uuid",
    "occurred_at": "2026-06-02T12:00:00.000Z",
    "source": {
      "app": "moveis-nascimento",
      "env": "production",
      "channel": "crm"
    },
    "data": {
      "ping": true,
      "message": "Teste manual de webhook"
    },
    "meta": {
      "triggered_by": "webhooksManagementService.testEndpoint"
    }
  }
}
```

No n8n:

- [ ] Criar um endpoint HTTP/Webhook.
- [ ] Cadastrar a URL em `webhook_endpoints`.
- [ ] Marcar `active = true`.
- [ ] Incluir o evento desejado no array `events`.
- [ ] Se usar `secret`, validar o header `X-Webhook-Secret`.
- [ ] Conferir logs em `webhook_logs` apos o teste.

Eventos disponiveis:

- `lead.created`
- `opportunity.created`
- `opportunity.stage_changed`
- `order.created`
- `order.stage_changed`
- `home_ambience_click`
- `webhook.test`

## 6. Testes de erro

Execute pelo menos uma vez por categoria de endpoint:

- [ ] Sem `x-agent-token`.
- [ ] Token invalido.
- [ ] Token inativo.
- [ ] Token sem scope necessario.
- [ ] Parametro obrigatorio ausente.
- [ ] ID inexistente quando aplicavel.

## 7. Conferencia no banco

Depois dos testes:

- [ ] `agent_tokens.last_used_at` foi atualizado.
- [ ] `leads` foi criado ou atualizado quando houve interesse.
- [ ] `lead_timeline` recebeu nota/evento da IA.
- [ ] `orders` confere com as respostas de rastreio.
- [ ] `webhook_logs` registra tentativas de webhook.

## 8. Schema e migrations

- [ ] Revisar a migration `supabase/migrations/019_ai_n8n_integration_schema_contract.sql`.
- [ ] Revisar a documentacao [SCHEMA-INTEGRACAO-IA-N8N.md](./SCHEMA-INTEGRACAO-IA-N8N.md).
- [ ] Fazer backup/snapshot antes de aplicar em producao.
- [ ] Aplicar primeiro em ambiente de teste, se disponivel.
- [ ] Rodar as consultas de verificacao documentadas apos aplicar.

## 9. Pontos conhecidos

- [ ] `agent_find_recent_orders_by_phone.product_name` ainda nao representa o nome real do produto; hoje usa o label do estagio.
- [ ] Endpoints de produtos retornam `ok:false` nos erros, mas mantem status HTTP convencionais para compatibilidade.
- [ ] O schema versionado do repositorio pode estar atrasado em relacao ao banco real; validar tabelas no Supabase antes de recriar ambiente do zero.

## Resultado esperado

Ao final, o fluxo do n8n deve conseguir:

- Buscar produtos.
- Registrar interesse com lead/timeline.
- Atualizar status para atendimento humano.
- Rastrear pedido por telefone.
- Receber ou testar webhooks.
