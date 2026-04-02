# Checklist de Validação n8n (Compacto)

## Configuração Base
- **URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`
- **Header:** `x-agent-token: {SEU_TOKEN_HASH}`

---

## 1. Criar Lead
```
POST agent_create_lead
```

**Body:**
```json
{
  "name": "Teste IA",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "Teste de integração IA"
}
```

**Validar:**
- [ ] `ok: true`
- [ ] `lead.id` retornado (GUARDAR ESTE ID para próximos testes)
- [ ] Banco: `SELECT * FROM leads WHERE name = 'Teste IA'`

**Scope:** `leads:write`

---

## 2. Atualizar Status do Lead
```
POST agent_update_lead_status
```

**Body:**
```json
{
  "lead_id": "{ID_DO_LEAD_DO_PASSO_1}",
  "status": "talking_human"
}
```

**Validar:**
- [ ] `ok: true`
- [ ] `old_status: "new_interest"`
- [ ] `new_status: "talking_human"`
- [ ] Banco: `SELECT status FROM leads WHERE id = '{ID_DO_LEAD}'`

**Scope:** `leads:update`

---

## 3. Adicionar Nota ao Lead
```
POST agent_add_lead_note
```

**Body:**
```json
{
  "lead_id": "{ID_DO_LEAD_DO_PASSO_1}",
  "message": "Nota de teste via n8n"
}
```

**Validar:**
- [ ] `ok: true`
- [ ] `note.id` retornado
- [ ] Banco: `SELECT * FROM lead_timeline WHERE lead_id = '{ID_DO_LEAD}' ORDER BY created_at DESC LIMIT 1`

**Scope:** `leads:write`

---

## 4. Buscar Status do Pedido
```
GET agent_get_order_status?order_id={ORDER_ID_EXISTENTE}
```

**Validar:**
- [ ] `ok: true`
- [ ] `order.status.technical` existe
- [ ] `order.status.friendly` existe
- [ ] Banco: `SELECT * FROM orders WHERE id = '{ORDER_ID}'`

**Scope:** `leads:read` ou `products:read`

**Observação:** Precisa de um `order_id` válido no banco

---

## 5. Buscar Montadores Ativos
```
GET agent_get_assemblers
```

**Ou com filtro de cidade:**
```
GET agent_get_assemblers?city=São+Paulo&limit=10
```

**Validar:**
- [ ] `ok: true`
- [ ] `assemblers` é array
- [ ] `count` > 0
- [ ] Cada montador tem: `id`, `name`, `phone`, `city`, `bio`, `photo_url`
- [ ] Banco: `SELECT * FROM installers WHERE active = true`

**Scope:** `leads:read` ou `products:read`

---

## 6. Buscar Produtos (Bônus)
```
GET agent_products_search?q=solar&limit=5
```

**Validar:**
- [ ] `ok: true`
- [ ] `products` é array
- [ ] Cada produto tem: `id`, `name`, `short_description`, `category_slug`, `category_name`, `image`, `public_url`

**Scope:** `products:read`

---

## 7. Buscar Produto por ID (Bônus)
```
GET agent_product_by_id?id={PRODUCT_ID_EXISTENTE}
```

**Validar:**
- [ ] `ok: true`
- [ ] `product` contém todos os campos
- [ ] Se token tem `products:read_private`, `product.private` tem dados sensíveis
- [ ] Se não tem, `product.private` é `null`

**Scope:** `products:read`

---

## Testes de Erro (Aplicar a TODOS os endpoints)

### Sem Token
- [ ] Remover header `x-agent-token`
- [ ] Esperado: `ok: false, error: "Missing x-agent-token header"`

### Token Inválido
- [ ] Usar token: "token_invalido_teste"
- [ ] Esperado: `ok: false, error: "Invalid or inactive token"`

### Sem Permissão
- [ ] Usar token sem o scope necessário
- [ ] Esperado: `ok: false, error: "Insufficient permissions"`

### Parâmetros Faltando
- [ ] Não enviar campos obrigatórios
- [ ] Esperado: `ok: false, error: "Missing required field: X"`

### ID Inexistente
- [ ] Usar lead_id/order_id inválido: "00000000-0000-0000-0000-000000000000"
- [ ] Esperado: `ok: false, error: "Lead not found"` ou similar

---

## Resumo de Scopes por Endpoint

| Endpoint | Scope Necessário |
|----------|------------------|
| agent_create_lead | `leads:write` |
| agent_update_lead_status | `leads:update` |
| agent_add_lead_note | `leads:write` |
| agent_get_order_status | `leads:read` ou `products:read` |
| agent_get_assemblers | `leads:read` ou `products:read` |
| agent_products_search | `products:read` |
| agent_product_by_id | `products:read` |

---

## Checklists Rápidos

### Para Cada Endpoint (Sucesso)
- [ ] Token correto com scope necessário
- [ ] Método HTTP correto (GET/POST)
- [ ] Headers corretos
- [ ] Body/Query params corretos
- [ ] `ok: true` na resposta
- [ ] Validação dos campos retornados
- [ ] Conferência no banco de dados

### Para Cada Endpoint (Erro)
- [ ] Testar sem token
- [ ] Testar token inválido
- [ ] Testar sem permissão
- [ ] Testar parâmetros faltando
- [ ] Testar IDs inexistentes (quando aplicável)

---

## Notas Importantes

1. **Sempre status 200**: Mesmo em erro, o endpoint retorna status HTTP 200. Veja o campo `ok`.

2. **Token Hash**: O token no header deve ser o `token_hash` da tabela `agent_tokens`, não o token em texto.

3. **IDs Únicos**: Use os IDs retornados nos testes anteriores (como `lead_id`) nos próximos testes.

4. **Banco de Dados**: Sempre valide no banco após testar cada endpoint.

5. **Scopes**: Certifique-se de que o token tem os scopes necessários antes de testar.

---

## Status da Validação

**Antes de começar:**
- [ ] Ter um token criado no banco com todos os scopes
- [ ] Ter o `token_hash` do token
- [ ] Ter um `order_id` e `product_id` válidos no banco
- [ ] Ter ao menos um montador ativo no banco

**Durante os testes:**
- [ ] Testar cada endpoint na ordem indicada
- [ ] Registrar resultados em planilha ou documento
- [ ] Anotar qualquer comportamento inesperado
- [ ] Validar sempre no banco de dados

**Após os testes:**
- [ ] Limpar dados de teste (opcional)
- [ ] Documentar issues encontradas
- [ ] Validar que todos os endpoints funcionam conforme esperado
