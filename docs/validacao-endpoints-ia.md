# Validação Manual de Endpoints - Integração IA via n8n

**URL Base:** `https://kbpkdnptzvsvoujirfwe.supabase.co/functions/v1/`

**Autenticação:** Header `x-agent-token` com o token hash do agente

**Scopes Necessários:**
- `leads:read` - Ler leads e oportunidades
- `leads:write` - Criar e modificar leads
- `leads:update` - Atualizar status de leads
- `products:read` - Ler produtos
- `products:read_private` - Ler informações privadas de produtos (preço, etc)

---

## ENDPOINT 1: Criar Lead

**Método:** `POST`
**URL:** `{BASE_URL}agent_create_lead`

### Headers
```
Content-Type: application/json
x-agent-token: {TOKEN_HASH}
```

### Body (JSON)
```json
{
  "name": "João Silva",
  "phone": "11999999999",
  "channel": "site",
  "status": "new_interest",
  "notes": "Lead criado via integração IA"
}
```

### Campos Obrigatórios
- `name` (string): Nome do lead
- `phone` (string): Telefone do lead

### Campos Opcionais
- `channel` (string): Canal de origem (padrão: "site")
  - Opções: "site", "whatsapp", "instagram", "facebook", "google"
- `status` (string): Status inicial (padrão: "new_interest")
  - Opções: "new_interest", "talking_ai", "talking_human", "proposal_sent", "won", "lost"
- `notes` (string): Observações adicionais

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "uuid-do-lead",
    "name": "João Silva",
    "phone": "11999999999",
    "channel": "site",
    "status": "new_interest",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Mensagem de erro específica"
}
```

### Tabelas a Conferir no Banco (Após Teste)
1. **leads**: Verificar se o novo lead foi criado
   ```sql
   SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
   ```
2. **lead_timeline**: Verificar se o evento inicial foi criado
   ```sql
   SELECT * FROM lead_timeline ORDER BY created_at DESC LIMIT 1;
   ```

### Checklist de Validação n8n
- [ ] Token com scope `leads:write`
- [ ] Enviar request POST com todos os campos obrigatórios
- [ ] Validar que `ok: true` na resposta
- [ ] Anotar o `lead.id` retornado para testes seguintes
- [ ] Conferir no banco se o lead existe
- [ ] Conferir no banco se o evento de timeline foi criado

---

## ENDPOINT 2: Atualizar Status do Lead

**Método:** `POST`
**URL:** `{BASE_URL}agent_update_lead_status`

### Headers
```
Content-Type: application/json
x-agent-token: {TOKEN_HASH}
```

### Body (JSON)
```json
{
  "lead_id": "uuid-do-lead",
  "status": "talking_human"
}
```

### Campos Obrigatórios
- `lead_id` (UUID): ID do lead a atualizar
- `status` (string): Novo status

### Status Válidos
- `new_interest` - Novo Interesse
- `talking_ai` - Falando com IA
- `talking_human` - Falando com Humano
- `proposal_sent` - Proposta Enviada
- `won` - Ganho
- `lost` - Perdido

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "message": "Lead status updated successfully",
  "lead_id": "uuid-do-lead",
  "old_status": "new_interest",
  "new_status": "talking_human"
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Lead not found"
}
```

### Tabelas a Conferir no Banco (Após Teste)
1. **leads**: Verificar se o status foi atualizado
   ```sql
   SELECT id, name, status FROM leads WHERE id = 'uuid-do-lead';
   ```
2. **lead_timeline**: Verificar se o evento de mudança foi criado
   ```sql
   SELECT * FROM lead_timeline 
   WHERE lead_id = 'uuid-do-lead' 
   ORDER BY created_at DESC LIMIT 1;
   ```

### Checklist de Validação n8n
- [ ] Token com scope `leads:update`
- [ ] Usar `lead_id` obtido no Endpoint 1
- [ ] Enviar request POST com status diferente
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `old_status` e `new_status` estão corretos
- [ ] Conferir no banco se o status do lead mudou
- [ ] Conferir no banco se o evento de timeline foi criado

---

## ENDPOINT 3: Inserir Nota no Lead

**Método:** `POST`
**URL:** `{BASE_URL}agent_add_lead_note`

### Headers
```
Content-Type: application/json
x-agent-token: {TOKEN_HASH}
```

### Body (JSON)
```json
{
  "lead_id": "uuid-do-lead",
  "message": "Cliente demonstrou interesse no modelo X"
}
```

### Campos Obrigatórios
- `lead_id` (UUID): ID do lead
- `message` (string): Conteúdo da nota

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "message": "Lead note added successfully",
  "lead_id": "uuid-do-lead",
  "note": {
    "id": "uuid-da-nota",
    "message": "Cliente demonstrou interesse no modelo X",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Lead not found"
}
```

### Tabelas a Conferir no Banco (Após Teste)
1. **lead_timeline**: Verificar se a nota foi inserida
   ```sql
   SELECT * FROM lead_timeline 
   WHERE lead_id = 'uuid-do-lead' 
   AND type = 'note'
   ORDER BY created_at DESC LIMIT 1;
   ```

### Checklist de Validação n8n
- [ ] Token com scope `leads:write`
- [ ] Usar `lead_id` obtido no Endpoint 1
- [ ] Enviar request POST com mensagem válida
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `note.id` foi retornado
- [ ] Conferir no banco se a nota existe na timeline

---

## ENDPOINT 4: Buscar Status do Pedido

**Método:** `GET`
**URL:** `{BASE_URL}agent_get_order_status?order_id={ORDER_ID}`

### Headers
```
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `order_id` (UUID, obrigatório): ID do pedido

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "order": {
    "id": "uuid-do-pedido",
    "status": {
      "technical": "assembly",
      "friendly": "Em Montagem"
    },
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-02T10:00:00.000Z"
  },
  "customer": {
    "id": "uuid-do-lead",
    "name": "João Silva",
    "phone": "11999999999"
  },
  "opportunity": {
    "id": "uuid-da-oportunidade",
    "stage": {
      "technical": "won",
      "friendly": "Ganho"
    },
    "product": {
      "name": "Módulo Solar 400W"
    }
  }
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Order not found"
}
```

### Status Técnicos Possíveis
- `order_created` - Pedido Criado
- `preparing_order` - Preparando Pedido
- `assembly` - Em Montagem
- `ready_to_ship` - Pronto para Envio
- `delivery_route` - Em Rota de Entrega
- `delivered` - Entregue
- `canceled` - Cancelado

### Tabelas a Conferir no Banco (Após Teste)
1. **orders**: Verificar dados do pedido
   ```sql
   SELECT * FROM orders WHERE id = 'uuid-do-pedido';
   ```

### Checklist de Validação n8n
- [ ] Token com scope `leads:read` ou `products:read`
- [ ] Ter um `order_id` válido no banco para teste
- [ ] Enviar request GET com `order_id` na query string
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `status.technical` e `status.friendly` estão presentes
- [ ] Conferir no banco se o pedido existe e os dados conferem

---

## ENDPOINT 5: Buscar Montadores Ativos

**Método:** `GET`
**URL:** `{BASE_URL}agent_get_assemblers?city={CITY}&limit={LIMIT}`

### Headers
```
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `city` (string, opcional): Filtrar por cidade (busca parcial)
- `limit` (número, opcional, padrão: 20, máximo: 50): Quantidade de resultados

### Exemplo de URL
```
{BASE_URL}agent_get_assemblers?city=São+Paulo&limit=10
```

### Resposta Esperada (Sucesso)
```json
{
  "ok": true,
  "assemblers": [
    {
      "id": "uuid-do-montador-1",
      "name": "Carlos Oliveira",
      "phone": "11988887777",
      "city": "São Paulo",
      "bio": "Especialista em montagem de painéis solares",
      "photo_url": "https://url-da-foto.jpg"
    },
    {
      "id": "uuid-do-montador-2",
      "name": "Ana Souza",
      "phone": "11977776666",
      "city": "São Paulo",
      "bio": "Montadora certificada com 5 anos de experiência",
      "photo_url": null
    }
  ],
  "count": 2
}
```

### Resposta Esperada (Erro)
```json
{
  "ok": false,
  "error": "Invalid or inactive token"
}
```

### Tabelas a Conferir no Banco (Após Teste)
1. **installers**: Verificar montadores ativos
   ```sql
   SELECT * FROM installers WHERE active = true;
   ```

### Checklist de Validação n8n
- [ ] Token com scope `leads:read` ou `products:read`
- [ ] Enviar request GET sem filtros
- [ ] Validar que `ok: true` na resposta
- [ ] Validar que `assemblers` é um array
- [ ] Validar que `count` corresponde ao tamanho do array
- [ ] Testar filtro por cidade (se houver montadores em cidades diferentes)
- [ ] Conferir no banco se os dados conferem

---

## ENDPOINT 6: Buscar Produtos (Bônus - Já Implementado)

**Método:** `GET`
**URL:** `{BASE_URL}agent_products_search?q={QUERY}&category={SLUG}&limit={LIMIT}`

### Headers
```
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `q` (string, opcional): Termo de busca (busca em nome e descrição)
- `category` (string, opcional): Slug da categoria
- `limit` (número, opcional, padrão: 10, máximo: 50): Quantidade de resultados

### Resposta Esperada
```json
{
  "ok": true,
  "products": [
    {
      "id": "uuid-do-produto",
      "name": "Módulo Solar 400W",
      "short_description": "Painel solar de alta eficiência...",
      "category_slug": "modulos-solares",
      "category_name": "Módulos Solares",
      "image": "https://url-da-imagem.jpg",
      "public_url": "https://site.com/product/uuid-do-produto"
    }
  ],
  "count": 1
}
```

### Checklist de Validação n8n
- [ ] Token com scope `products:read`
- [ ] Testar busca sem filtros
- [ ] Testar busca com termo específico
- [ ] Testar filtro por categoria (se houver)

---

## ENDPOINT 7: Buscar Produto por ID (Bônus - Já Implementado)

**Método:** `GET`
**URL:** `{BASE_URL}agent_product_by_id?id={PRODUCT_ID}`

### Headers
```
x-agent-token: {TOKEN_HASH}
```

### Query Parameters
- `id` (UUID, obrigatório): ID do produto

### Resposta Esperada
```json
{
  "ok": true,
  "product": {
    "id": "uuid-do-produto",
    "name": "Módulo Solar 400W",
    "description": "Descrição completa do produto...",
    "images": ["url1.jpg", "url2.jpg"],
    "categories": [
      {
        "id": "uuid-da-categoria",
        "name": "Módulos Solares",
        "slug": "modulos-solares"
      }
    ],
    "public_url": "https://site.com/product/uuid-do-produto",
    "private": {
      "internal_code": "MOD-400W-01",
      "price": 1500.00,
      "currency": "BRL",
      "payment_terms": "À vista ou parcelado",
      "stock_status": "sob_consulta"
    }
  }
}
```

### Nota Importante
O campo `private` só será preenchido se o token tiver o scope `products:read_private`.

### Checklist de Validação n8n
- [ ] Token com scope `products:read`
- [ ] Ter um `product_id` válido
- [ ] Validar que `ok: true` na resposta
- [ ] Testar com token sem `products:read_private` para verificar que `private` é null
- [ ] Testar com token com `products:read_private` para ver dados privados

---

## VALIDAÇÃO DE ERROS

### Testes Comuns de Erro
Para todos os endpoints, testar também:

1. **Sem token**
   - Remover header `x-agent-token`
   - Esperado: `{ "ok": false, "error": "Missing x-agent-token header" }`

2. **Token inválido**
   - Usar token inválido
   - Esperado: `{ "ok": false, "error": "Invalid or inactive token" }`

3. **Sem permissão**
   - Usar token sem scope necessário
   - Esperado: `{ "ok": false, "error": "Insufficient permissions" }`

4. **Parâmetros obrigatórios faltando**
   - Não enviar campos obrigatórios
   - Esperado: `{ "ok": false, "error": "Missing required field: X" }`

5. **Lead/Order não encontrado**
   - Usar IDs que não existem
   - Esperado: `{ "ok": false, "error": "Lead not found" }` ou similar

---

## FLUXO DE TESTE COMPLETO SUGERIDO (n8n)

### Setup Inicial
1. Criar um token de agente com todos os scopes necessários
2. Obter o `token_hash` do banco
3. Ter pelo menos um pedido e um produto no banco para teste

### Sequência de Testes
1. **Endpoint 1**: Criar lead (anotar `lead_id`)
2. **Endpoint 2**: Atualizar status do lead (usar `lead_id` do passo 1)
3. **Endpoint 3**: Adicionar nota ao lead (usar `lead_id` do passo 1)
4. **Endpoint 4**: Buscar status de pedido existente
5. **Endpoint 5**: Buscar montadores ativos
6. **Endpoint 6**: Buscar produtos
7. **Endpoint 7**: Buscar produto específico por ID

### Testes de Erro
Para cada endpoint acima, repetir testando:
- Sem token
- Token inválido
- Token sem permissão
- Parâmetros obrigatórios faltando

---

## OBSERVAÇÕES IMPORTANTES

1. **Status HTTP**: Todos os endpoints retornam **sempre status 200** mesmo em erros. O sucesso/falha é determinado pelo campo `ok` na resposta.

2. **Autenticação**: O token é validado na tabela `agent_tokens` onde:
   - `token_hash` deve corresponder ao hash do token
   - `active` deve ser `true`
   - `scopes` deve incluir o scope necessário

3. **Logging**: Cada requisição atualiza o campo `last_used_at` no registro do token.

4. **CORS**: Todos os endpoints suportam preflight requests OPTIONS.

5. **Timeline**: Operações em leads (criar, atualizar, adicionar nota) criam automaticamente registros em `lead_timeline`.

---

## CHECKLIST FINAL DE VALIDAÇÃO

### Testes de Sucesso
- [ ] Criar lead com sucesso
- [ ] Atualizar status do lead com sucesso
- [ ] Adicionar nota ao lead com sucesso
- [ ] Buscar status do pedido com sucesso
- [ ] Buscar montadores ativos com sucesso
- [ ] Buscar produtos com sucesso
- [ ] Buscar produto por ID com sucesso

### Testes de Erro
- [ ] Testar ausência de token em todos os endpoints
- [ ] Testar token inválido em todos os endpoints
- [ ] Testar token sem permissão apropriada
- [ ] Testar parâmetros obrigatórios faltando
- [ ] Testar IDs inexistentes

### Validação de Banco
- [ ] Conferir tabela `leads` após criação/atualização
- [ ] Conferir tabela `lead_timeline` após cada operação
- [ ] Conferir tabela `orders` ao testar status do pedido
- [ ] Conferir tabela `installers` ao buscar montadores
- [ ] Conferir tabela `products` ao buscar produtos

### Documentação
- [ ] Documentar qualquer comportamento inesperado
- [ ] Documentar latência média de cada endpoint
- [ ] Validar que todos os campos retornados estão corretos

---

## STATUS FINAL

✅ Todos os 5 endpoints solicitados estão implementados
✅ 2 endpoints bônus já existem e podem ser validados
✅ Padrão de autenticação consistente em todos os endpoints
✅ Tratamento de erros padronizado (sempre status 200 com campo `ok`)
✅ Registros de timeline automáticos para operações em leads

**Próximo passo:** Realizar testes manuais no n8n seguindo este checklist.
