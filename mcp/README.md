# MCP de Atendimento - Moveis Nascimento

Este MCP expoe ferramentas seguras para o agente de IA do n8n consultar e registrar dados no sistema sem montar varios nodes HTTP.

Ele acessa o Supabase diretamente via REST usando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Por isso, deve rodar em ambiente privado e protegido por `MCP_AUTH_TOKEN`.

## Como iniciar

No PowerShell, dentro do projeto:

```powershell
$env:SUPABASE_URL="https://SEU_PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="cole_aqui_a_service_role_key"
$env:MCP_AUTH_TOKEN="crie_um_token_para_o_n8n"
npm run mcp
```

Endpoints locais:

- Health: `http://localhost:3030/health`
- MCP SSE: `http://localhost:3030/sse`
- MCP Streamable HTTP: `http://localhost:3030/mcp`

No n8n, use:

```text
Transport: SSE
SSE URL: http://moveis-mcp_moveis-mcp:3030/sse
Authorization: Bearer MCP_AUTH_TOKEN
```

Se a sua versao do n8n oferecer `Streamable HTTP`, use:

```text
URL: http://moveis-mcp_moveis-mcp:3030/mcp
Authorization: Bearer MCP_AUTH_TOKEN
```

## Variaveis

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave secreta com permissao elevada para acesso direto ao banco.
- `MCP_AUTH_TOKEN`: token obrigatorio para proteger o endpoint MCP.
- `MCP_PORT`: porta local, padrao `3030`.
- `MCP_HOST`: host de bind, padrao `0.0.0.0`.
- `PUBLIC_SITE_URL`: opcional; ajuda a montar URLs publicas de produtos.

## Ferramentas disponiveis

- `search_products`: busca produtos ativos por termo/categoria.
- `get_product_details`: le detalhes de um produto por ID.
- `register_customer_interest`: cria/reutiliza lead pelo telefone e registra interesse.
- `add_lead_note`: adiciona nota na timeline de um lead.
- `request_human_attendant`: registra pedido de humano e coloca o lead em `talking_human`.
- `find_recent_orders_by_phone`: busca pedidos recentes pelo telefone.
- `get_order_status`: consulta status de pedido.
- `search_installers`: busca montadores ativos por cidade.

Por decisao de seguranca, este MCP nao expoe exclusao, edicao de produtos ou alteracoes administrativas sensiveis.

## Teste rapido

Com o servidor rodando:

```powershell
Invoke-RestMethod http://localhost:3030/health
```

O retorno deve listar as ferramentas e indicar `supabase_configured: true` e `auth_configured: true`.
