# Contrato: crm.addTimelineNote

**Status:** 🚧 CONTRATO DEFINIDO (NÃO IMPLEMENTADO)  
**Data:** 2025-01-06  
**Domínio:** CRM (WRITE)  
**Prioridade:** Futura expansão de CRM

---

## Objetivo

Esta função permite adicionar notas ao timeline de um lead existente, registrando interações, observações ou contexto adicional durante o processo de atendimento.

**⚠️ IMPORTANTE:** Esta função NÃO deve ser usada para registrar interesse inicial. Use `agent_create_lead_interest` para isso.

---

## Nome da Função

```
supabase/functions/agent_add_timeline_note/index.ts
```

**Prefixo:** `agent_` (mantém consistência com outras funções de agente)

---

## Método

```
POST
```

---

## Autenticação

**Mesmo padrão das funções existentes:**

### Headers Requeridos
```
x-agent-token: <token_hash>
content-type: application/json
```

### Escopo Necessário
```
leads:write
```

### Fluxo de Validação
1. Extrair `x-agent-token` do header
2. Consultar tabela `agent_tokens` com:
   - `token_hash` = valor recebido
   - `active` = true
3. Verificar se token possui escopo `leads:write`
4. Atualizar `last_used_at` do token
5. Executar lógica da função

---

## Requisição (Request)

### URL
```
https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_timeline_note
```

### Headers
```
x-agent-token: 312166dda8c49a5ea856092f016b8333b1086fdb9a42abc98b1037f7ba0856f0
content-type: application/json
```

### Body (JSON)
```json
{
  "lead_id": "uuid-obrigatorio",
  "message": "string-obrigatorio",
  "source": "agent | n8n | system",
  "meta": {
    "intent": "string-opcional",
    "product_id": "uuid-opcional",
    "product_name": "string-opcional",
    "category_slug": "string-opcional",
    "additional_field": "qualquer-valor-opcional"
  }
}
```

### Campos Explicados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lead_id` | UUID | ✅ Sim | ID do lead existente no CRM |
| `message` | string | ✅ Sim | Conteúdo da nota/timeline |
| `source` | string | ✅ Sim | Origem da nota: `agent` (IA), `n8n` (orquestração), `system` (automático) |
| `meta` | object | ❌ Não | Metadados adicionais (livre) |

### Valores Válidos para `source`
- `"agent"` - Nota criada diretamente pela IA durante conversa
- `"n8n"` - Nota criada pelo sistema de orquestração/n8n
- `"system"` - Nota automática do sistema

---

## Resposta (Response)

### Sucesso (200)
```json
{
  "ok": true,
  "message": "Timeline note added successfully",
  "timeline_entry": {
    "id": "uuid-da-entrada",
    "lead_id": "uuid-do-lead",
    "type": "note",
    "message": "mensagem-da-nota",
    "created_at": "2025-01-06T10:30:00.000Z"
  }
}
```

### Erro de Validação (200 - padrão do sistema)
```json
{
  "ok": false,
  "error": "Missing required field: lead_id"
}
```

### Erro de Autenticação (401)
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

### Erro de Permissão (403)
```json
{
  "ok": false,
  "error": "Insufficient permissions"
}
```

### Erro Interno (500)
```json
{
  "ok": false,
  "error": "Internal server error"
}
```

---

## Comportamento Esperado

### 1. Validação
- Verificar se `lead_id` é um UUID válido
- Verificar se `message` não está vazio
- Verificar se `source` é um valor válido (`agent`, `n8n`, `system`)

### 2. Validação de Lead
- Verificar se lead existe e não está arquivado (`archived = false`)

### 3. Criação de Timeline Entry
```sql
INSERT INTO lead_timeline (
  lead_id,
  type,
  message,
  meta,
  created_by
) VALUES (
  :lead_id,
  'note',
  :message,
  :meta_com_agent_info,
  NULL
)
```

### 4. Metadados Automáticos no `meta`
A função deve incluir automaticamente no `meta`:
```json
{
  "source": "valor-passado-na-requisicao",
  "agent_id": "id-do-token-agent",
  "agent_name": "nome-do-token-agent",
  // ... campos adicionais passados na requisicao
}
```

### 5. Atualização de Lead
Atualizar `last_activity_at` do lead para `NOW()`

---

## Exemplos de Uso

### Exemplo 1: IA adiciona nota sobre preferência do cliente
```bash
curl -X POST \
  https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_timeline_note \
  -H 'x-agent-token: 312166dda8c49a5ea856092f016b8333b1086fdb9a42abc98b1037f7ba0856f0' \
  -H 'content-type: application/json' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Cliente mencionou preferência por produtos com madeira maciça",
    "source": "agent",
    "meta": {
      "intent": "product_preference",
      "category_slug": "moveis"
    }
  }'
```

### Exemplo 2: n8n registra resultado de follow-up manual
```bash
curl -X POST \
  https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/agent_add_timeline_note \
  -H 'x-agent-token: 312166dda8c49a5ea856092f016b8333b1086fdb9a42abc98b1037f7ba0856f0' \
  -H 'content-type: application/json' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Follow-up realizado por telefone - cliente aguardando proposta",
    "source": "n8n",
    "meta": {
      "channel": "phone",
      "result": "waiting_proposal"
    }
  }'
```

---

## Quando USAR esta função

✅ **Deve usar quando:**
- Cliente já existe no CRM (lead já criado)
- Quer registrar contexto adicional (preferências, follow-ups, observações)
- Quer adicionar nota de interação manual realizada por humano
- Quer registrar progresso no atendimento

❌ **NÃO deve usar quando:**
- Cliente está manifestando interesse pela primeira vez → Use `agent_create_lead_interest`
- Quer registrar contato inicial → Use `agent_create_lead_interest`

---

## Quando NÃO Usar

- ❌ **NÃO** usar para criar novo lead (use `agent_create_lead_interest`)
- ❌ **NÃO** usar para atualizar status de lead (isso seria outra função)
- ❌ **NÃO** usar para marcar lead como arquivado (isso seria outra função)

---

## Diferença para `agent_create_lead_interest`

| Aspecto | `agent_create_lead_interest` | `agent_add_timeline_note` |
|---------|------------------------------|---------------------------|
| **Propósito** | Registrar interesse inicial de contato | Adicionar notas a lead existente |
| **Lead** | Cria novo se não existe | Requer lead existente |
| **Caso de uso** | "Quero que me liguem", "Quero orçamento" | "Cliente prefere madeira", "Follow-up realizado" |
| **Timing** | Primeiro contato | Durante o processo de atendimento |
| **Status do lead** | Cria lead com status `new_interest` | Não altera status, apenas adiciona timeline |

---

## Logs Padrão

```typescript
console.log('[agent_add_timeline_note] Request received:', { lead_id, message, source, meta });
console.log('[agent_add_timeline_note] Lead found:', lead_id);
console.log('[agent_add_timeline_note] Timeline entry created successfully');
console.log('[agent_add_timeline_note] Response:', response);
```

---

## Código de Erro Específicos

| Código HTTP | Erro | Quando Ocorre |
|-------------|------|---------------|
| 200 | `Missing required field: lead_id` | Campo `lead_id` não fornecido |
| 200 | `Missing required field: message` | Campo `message` não fornecido |
| 200 | `Invalid lead_id format` | `lead_id` não é UUID válido |
| 200 | `Lead not found` | Lead não existe ou está arquivado |
| 401 | `Invalid or inactive token` | Token inválido ou inativo |
| 403 | `Insufficient permissions` | Token não tem escopo `leads:write` |
| 500 | `Internal server error` | Erro inesperado no servidor |

---

## Estrutura de Implementação (Futura)

**NÃO implementar agora. Este é apenas o modelo para implementação futura:**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-agent-token, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Get agent token from header
    const agentToken = req.headers.get('x-agent-token')
    
    if (!agentToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing x-agent-token header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Validate token and check scopes
    const { data: tokenData, error: tokenError } = await supabase
      .from('agent_tokens')
      .select('*')
      .eq('token_hash', agentToken)
      .eq('active', true)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or inactive token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check if token has leads:write scope
    if (!tokenData.scopes.includes('leads:write')) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Update last_used_at
    await supabase
      .from('agent_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // 6. Parse request body
    const body = await req.json()
    const { lead_id, message, source, meta } = body

    console.log('[agent_add_timeline_note] Request received:', { lead_id, message, source, meta })

    // 7. Validate required fields
    if (!lead_id) {
      console.log('[agent_add_timeline_note] Validation failed: missing lead_id')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: lead_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!message) {
      console.log('[agent_add_timeline_note] Validation failed: missing message')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: message' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Check if lead exists
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .is('archived', false)
      .single()

    if (leadError || !existingLead) {
      console.log('[agent_add_timeline_note] Lead not found')
      return new Response(
        JSON.stringify({ ok: false, error: 'Lead not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[agent_add_timeline_note] Lead found:', lead_id)

    // 9. Build meta with agent info
    const enrichedMeta = {
      source,
      agent_id: tokenData.id,
      agent_name: tokenData.name,
      ...(meta || {}),
    }

    // 10. Insert timeline entry
    const { data: timelineEntry, error: timelineError } = await supabase
      .from('lead_timeline')
      .insert({
        lead_id,
        type: 'note',
        message,
        meta: enrichedMeta,
        created_by: null,
      })
      .select()
      .single()

    if (timelineError) {
      console.error('[agent_add_timeline_note] Timeline insert error:', timelineError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to add timeline note' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[agent_add_timeline_note] Timeline entry created successfully')

    // 11. Update lead last_activity_at
    try {
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', lead_id)
    } catch (updateError) {
      console.error('[agent_add_timeline_note] Update activity error (non-critical):', updateError)
    }

    const response = {
      ok: true,
      message: 'Timeline note added successfully',
      timeline_entry: {
        id: timelineEntry.id,
        lead_id: timelineEntry.lead_id,
        type: timelineEntry.type,
        message: timelineEntry.message,
        created_at: timelineEntry.created_at,
      },
    }

    console.log('[agent_add_timeline_note] Response:', response)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[agent_add_timeline_note] Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Checklist para Implementação Futura

Quando implementar esta função, seguir este checklist:

- [ ] Criar arquivo `supabase/functions/agent_add_timeline_note/index.ts`
- [ ] Implementar validação de campos obrigatórios
- [ ] Implementar validação de UUID para `lead_id`
- [ ] Implementar verificação de lead existente
- [ ] Implementar inserção em `lead_timeline`
- [ ] Enriquecer `meta` com informações do agente
- [ ] Atualizar `last_activity_at` do lead
- [ ] Adicionar logs com prefixo `[agent_add_timeline_note]`
- [ ] Testar com tokens válidos e inválidos
- [ ] Testar com leads existentes e não-existentes
- [ ] Documentar no `AGENT_FUNCTIONS_ORGANIZATION.md`
- [ ] Atualizar documentação de orquestração/n8n

---

**Versão do Contrato:** 1.0  
**Última Atualização:** 2025-01-06  
**Status:** CONTRATO DEFINIDO, PRONTO PARA IMPLEMENTAÇÃO FUTURA
