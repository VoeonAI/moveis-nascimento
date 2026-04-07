# Memória Longa - Implementação Supabase

**Status:** ✅ IMPLEMENTADO
**Data:** 2025-01-06
**Versão:** 1.0

---

## Visão Geral

Implementação das tabelas de memória longa no Supabase para o agente conversacional, mantendo isolamento do Core/CRM principal.

**Objetivos:**
- Armazenar estado consolidado da conversa por telefone
- Armazenar histórico bruto de mensagens/eventos
- Suportar atualização incremental do resumo
- Detectar e tratar ambiguidades nas respostas

**Princípios:**
- ✅ Isolado do CRM principal
- ✅ Isolado do Core do sistema
- ✅ Isolado do auth
- ✅ Isolado do catálogo
- ✅ Isolado de Edge Functions existentes

---

## Tabelas Criadas

### 1. memory_consolidated

**Finalidade:** Estado resumido da conversa por telefone (1 registro por telefone)

**Campos:**

| Campo | Tipo | Obrigatório | Padrão | Finalidade |
|-------|------|-------------|--------|------------|
| `id` | UUID | Sim | `gen_random_uuid()` | Chave primária única |
| `phone` | TEXT | Sim | - | Telefone normalizado (UNIQUE) |
| `customer_name` | TEXT | Não | `null` | Nome do cliente |
| `city` | TEXT | Não | `null` | Cidade mencionada |
| `interests` | JSONB | Não | `'[]'::jsonb` | Array de interesses |
| `commercial_signals` | JSONB | Não | `'[]'::jsonb` | Array de sinais comerciais |
| `summary` | TEXT | Não | `null` | Resumo incremental da conversa |
| `last_agent_response` | TEXT | Não | `null` | Última resposta do agente |
| `last_message_at` | TIMESTAMP WITH TIME ZONE | Sim | `NOW()` | Timestamp da última mensagem |
| `message_count` | INTEGER | Não | `0` | Contador de mensagens |
| `created_at` | TIMESTAMP WITH TIME ZONE | Sim | `NOW()` | Timestamp de criação |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Sim | `NOW()` | Timestamp da última atualização |

**Índices:**
- `idx_memory_consolidated_phone` (UNIQUE)
- `idx_memory_consolidated_last_message_at` (DESC)

**RLS:**
- `memory_consolidated_select` → authenticated
- `memory_consolidated_insert` → authenticated
- `memory_consolidated_update` → authenticated

**Triggers:**
- `update_memory_consolidated_updated_at` → Atualiza `updated_at` automaticamente

---

### 2. memory_events

**Finalidade:** Histórico bruto de mensagens/eventos por telefone (N registros por telefone)

**Campos:**

| Campo | Tipo | Obrigatório | Padrão | Finalidade |
|-------|------|-------------|--------|------------|
| `id` | UUID | Sim | `gen_random_uuid()` | Chave primária única |
| `phone` | TEXT | Sim | - | Telefone normalizado |
| `message` | TEXT | Não | `null` | Mensagem do usuário |
| `agent_response` | TEXT | Não | `null` | Resposta do agente |
| `message_type` | TEXT | Sim | - | Tipo: "user" ou "agent" |
| `session_id` | TEXT | Não | `null` | Identificador da sessão |
| `metadata` | JSONB | Não | `'{}'::jsonb` | Dados adicionais (ambiguidade, etc.) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Sim | `NOW()` | Timestamp do evento |

**Constraints:**
- `check_message_or_response`: Garante que pelo menos `message` ou `agent_response` seja preenchido
- `check_message_type`: Valida que `message_type` seja "user" ou "agent"

**Índices:**
- `idx_memory_events_phone`
- `idx_memory_events_created_at` (DESC)
- `idx_memory_events_phone_created_at` (phone, created_at DESC)

**RLS:**
- `memory_events_select` → authenticated
- `memory_events_insert` → authenticated

---

## Regras de Modelagem

### Telefone Normalizado

**Campo:** `phone` (TEXT)

**Formato:** `+55 11 99999-9999` (internacional com espaços)

**Normalização:** Deve ser aplicada no n8n antes de inserir/buscar

```javascript
// Exemplo de normalização (n8n)
const normalizePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+55 ${cleaned.substring(0,2)} ${cleaned.substring(2,7)}-${cleaned.substring(7)}`;
  }
  return phone; // Fallback
};
```

**Unicidade:** Garantida por UNIQUE constraint em `memory_consolidated.phone`

---

### Relacionamento Events ↔ Consolidated

**Relacionamento:** Via campo `phone` (sem foreign key explícito)

**Motivo:**
- `memory_consolidated` tem 1:1 por telefone
- `memory_events` tem 1:N por telefone
- Gerenciamento de cascade é feito pelo n8n

**Busca padrão:**

```sql
-- Buscar memória consolidada
SELECT * FROM memory_consolidated WHERE phone = '+55 11 99999-9999';

-- Buscar últimos eventos
SELECT * FROM memory_events 
WHERE phone = '+55 11 99999-9999' 
ORDER BY created_at DESC 
LIMIT 20;
```

---

### Timestamps Automáticos

**created_at:** `DEFAULT NOW()` (automático na inserção)

**updated_at:** Gerenciado por trigger

```sql
CREATE TRIGGER update_memory_consolidated_updated_at
BEFORE UPDATE ON public.memory_consolidated
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Evitar Duplicidade Estrutural

**memory_consolidated:**
- `phone` é UNIQUE → impede múltiplos registros por telefone
- Upsert pattern recomendado:

```sql
INSERT INTO memory_consolidated (phone, customer_name, summary, ...)
VALUES ('+55 11 99999-9999', 'João', 'Resumo...', ...)
ON CONFLICT (phone) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  summary = EXCLUDED.summary,
  message_count = memory_consolidated.message_count + 1,
  updated_at = NOW();
```

**memory_events:**
- Aceita múltiplos registros por telefone (histórico completo)
- Deduplicação é gerenciada pelo n8n

---

## Padrões de Uso

### Inserir Nova Mensagem do Usuário

```sql
INSERT INTO memory_events (phone, message, message_type, session_id)
VALUES ('+55 11 99999-9999', 'Quanto custa?', 'user', 'session-123');
```

### Inserir Resposta do Agente

```sql
INSERT INTO memory_events (phone, agent_response, message_type, session_id)
VALUES ('+55 11 99999-9999', 'O valor é R$ 150.', 'agent', 'session-123');
```

### Inserir Evento com Ambiguidade

```sql
INSERT INTO memory_events (phone, message, message_type, session_id, metadata)
VALUES (
  '+55 11 99999-9999',
  'ok',
  'user',
  'session-123',
  '{"ambiguous": true, "ambiguity_type": "confirmation"}'::jsonb
);
```

### Upsert Memória Consolidada

```sql
INSERT INTO memory_consolidated (
  phone,
  customer_name,
  city,
  interests,
  commercial_signals,
  summary,
  last_agent_response,
  message_count
)
VALUES (
  '+55 11 99999-9999',
  'João Silva',
  'São Paulo',
  '[{"category": "serviços", "value": "manutenção"}]'::jsonb,
  '[{"type": "price_inquiry", "detected_at": "2025-01-06T10:00:00Z"}]'::jsonb,
  'Cliente interessado em manutenção. Perguntou sobre preço.',
  'O valor é R$ 150.',
  5
)
ON CONFLICT (phone) DO UPDATE SET
  customer_name = COALESCE(EXCLUDED.customer_name, memory_consolidated.customer_name),
  city = COALESCE(EXCLUDED.city, memory_consolidated.city),
  interests = EXCLUDED.interests,
  commercial_signals = EXCLUDED.commercial_signals,
  summary = EXCLUDED.summary,
  last_agent_response = EXCLUDED.last_agent_response,
  last_message_at = NOW(),
  message_count = memory_consolidated.message_count + 1,
  updated_at = NOW();
```

---

## Palavras-chave de Ambiguidade

Respostas que devem ser marcadas como ambíguas no `metadata.ambiguous`:

```
ok, ahan, uhum, certo, pode ser, acho, talvez, provavelmente,
não sei, talvez sim, talvez não, é possível, pode ser que,
vou pensar, deixa eu ver, hum, hmm, entendi (isolado), etc.
```

**Exemplo de metadata:**

```json
{
  "ambiguous": true,
  "ambiguity_type": "confirmation"
}
```

---

## Verificação de Implementação

### Consultar Tabelas

```sql
-- Listar tabelas de memória
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE 'memory_%'
ORDER BY tablename;
```

### Verificar Colunas

```sql
-- memory_consolidated
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'memory_consolidated'
ORDER BY ordinal_position;

-- memory_events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'memory_events'
ORDER BY ordinal_position;
```

### Verificar Índices

```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('memory_consolidated', 'memory_events')
ORDER BY tablename, indexname;
```

### Verificar RLS

```sql
-- memory_consolidated
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'memory_consolidated';

-- memory_events
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'memory_events';
```

---

## Checklist de Validação

✅ **Estrutura das Tabelas**
- [x] `memory_consolidated` criada com todos os campos
- [x] `memory_events` criada com todos os campos
- [x] Tipos de dados corretos
- [x] Valores padrão definidos
- [x] Chaves primárias configuradas

✅ **Índices**
- [x] `idx_memory_consolidated_phone` (UNIQUE)
- [x] `idx_memory_consolidated_last_message_at`
- [x] `idx_memory_events_phone`
- [x] `idx_memory_events_created_at`
- [x] `idx_memory_events_phone_created_at`

✅ **Constraints**
- [x] `check_message_or_response` em `memory_events`
- [x] `check_message_type` em `memory_events`
- [x] UNIQUE em `memory_consolidated.phone`

✅ **Segurança (RLS)**
- [x] RLS habilitado em ambas as tabelas
- [x] Políticas SELECT, INSERT, UPDATE configuradas
- [x] Acesso restrito a authenticated

✅ **Timestamps**
- [x] `created_at` com DEFAULT NOW()
- [x] `updated_at` com trigger automático

✅ **Isolamento**
- [x] Sem alterações no CRM principal
- [x] Sem alterações no Core
- [x] Sem alterações em auth
- [x] Sem alterações em catálogo
- [x] Sem alterações em Edge Functions

---

## Próximos Passos

1. **Implementar Fluxo n8n**
   - Normalização do telefone
   - Busca de memória consolidada
   - Busca de últimos eventos
   - Chamar organizador de memória
   - Chamar agente de resposta
   - Gravar eventos
   - Upsert memória consolidada

2. **Implementar Prompts**
   - Organizador de memória (atualização incremental)
   - Agente de resposta (respostas contextualizadas)

3. **Testes**
   - Inserção de mensagens
   - Upsert de memória consolidada
   - Detecção de ambiguidade
   - Atualização incremental do resumo
   - Consulta de histórico

---

## Notas

- As tabelas estão isoladas do CRM principal
- Não há foreign keys explícitas (relacionamento via `phone`)
- O gerenciamento de cascade é feito pelo n8n
- O trigger de `updated_at` é automático
- As políticas RLS permitem acesso completo a usuários autenticados

---

**Implementação concluída com sucesso! ✅**
