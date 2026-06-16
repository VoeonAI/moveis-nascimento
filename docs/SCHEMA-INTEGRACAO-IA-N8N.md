# Schema - Integracao IA e n8n

Este documento acompanha a migration:

`supabase/migrations/019_ai_n8n_integration_schema_contract.sql`

Ela consolida no repositorio o contrato de banco esperado pelas Edge Functions de agente IA, pelo painel de configuracoes e pelos fluxos n8n.

## O que a migration cobre

### `agent_tokens`

Cria a tabela se ela ainda nao existir:

- `id`
- `name`
- `token_hash`
- `scopes`
- `active`
- `created_at`
- `last_used_at`

Tambem habilita RLS e cria policy de gerenciamento apenas para perfil `master`.

### `orders`

Garante campos usados pelo pipeline e rastreio:

- `lead_id`
- `current_stage`
- `customer_name`
- `customer_phone`
- `internal_code`
- `delivery_address`
- `delivery_date`
- `delivered_at`
- `notes`

Tambem:

- faz backfill de `current_stage` a partir de `stage`, se a coluna antiga existir;
- define default `order_created`;
- remove `NOT NULL` de `total_value`, se a coluna existir;
- adiciona constraint nao validada para os valores conhecidos de `current_stage`;
- cria indices para telefone, etapa, lead e oportunidade.

### `order_events`

Garante campos usados pelos services:

- `note`
- `created_by`

### `installers`

Cria a tabela de montadores, se nao existir:

- `id`
- `name`
- `phone`
- `city`
- `bio`
- `photo_url`
- `active`
- `sort_order`
- `created_at`
- `updated_at`

Tambem habilita RLS:

- leitura publica apenas de montadores ativos;
- gerenciamento por `master` e `gestor`.

### `webhook_endpoints`

Garante campos usados pelo painel e por `webhooks_dispatch`:

- `name`
- `events`
- `active`
- `secret`

Tambem faz backfill:

- `active` a partir de `is_active`, se existir;
- `events` a partir de `event_type`, se existir;
- `name` a partir de `event_type` ou `Webhook`.

### `webhook_logs`

Garante campos usados pelos logs atuais:

- `event_type`
- `success`
- `error`
- `created_at`

Tambem faz backfill de `created_at` a partir de `attempted_at`, se existir.

## O que ela nao faz

- Nao remove colunas antigas.
- Nao apaga dados.
- Nao aplica alteracoes no banco automaticamente.
- Nao muda Edge Functions.
- Nao altera RLS de tabelas principais como `leads`, `orders`, `products` ou `opportunities`, exceto criar RLS/policies nas tabelas novas `agent_tokens` e `installers`.

## Validacao antes de aplicar

Antes de rodar em producao:

1. Fazer backup/snapshot do projeto Supabase.
2. Aplicar primeiro em ambiente de teste, se disponivel.
3. Rodar consultas de verificacao:

```sql
select id, name, scopes, active, last_used_at
from public.agent_tokens
limit 5;

select id, current_stage, customer_phone, internal_code
from public.orders
order by created_at desc
limit 5;

select id, name, phone, city, active
from public.installers
limit 5;

select id, name, events, active
from public.webhook_endpoints
limit 5;

select id, event_type, success, status_code, created_at
from public.webhook_logs
order by created_at desc
limit 5;
```

4. Testar endpoints:

- `agent_products_search`
- `agent_product_by_id`
- `agent_create_lead_interest`
- `agent_find_recent_orders_by_phone`
- `agent_get_order_status`
- `agent_get_assemblers`
- teste de webhook pelo painel.

## Observacao

O Supabase CLI nao estava instalado no ambiente local usado para criar esta migration, entao o arquivo foi criado manualmente como proxima migration sequencial.
