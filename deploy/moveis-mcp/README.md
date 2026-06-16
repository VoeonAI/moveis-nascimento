# Deploy Docker do MCP de Atendimento

Esta pasta sobe somente o MCP de atendimento. Ela nao mexe no frontend, nao mexe no app principal e nao altera o container do n8n.

O MCP acessa o Supabase diretamente via REST usando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Por isso ele deve ficar privado na VPS, acessivel apenas pelo n8n na rede Docker.

Por padrao, o MCP nao fica publico na internet. O n8n acessa o MCP pela rede Docker usando:

```text
http://moveis-mcp_moveis-mcp:3030/sse
```

## O que tem nesta pasta

- `Dockerfile`: cria a imagem Node.js do MCP.
- `docker-compose.yml`: Stack para Portainer.
- `.env.example`: modelo das variaveis.
- `server.mjs`: servidor MCP.
- `package.json`: script minimo para rodar o servidor.

## 1. Copiar para a VPS

Copie a pasta inteira para a VPS:

```text
deploy/moveis-mcp/
```

O importante e que estes arquivos fiquem juntos na mesma pasta:

```text
Dockerfile
docker-compose.yml
.env.example
package.json
package-lock.json
server.mjs
README.md
```

## 2. Criar o arquivo .env

Na VPS, dentro da pasta `moveis-mcp`, copie o exemplo:

```bash
cp .env.example .env
```

Depois edite o `.env`:

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=cole_aqui_a_service_role_key
MCP_AUTH_TOKEN=crie_um_token_forte_para_o_n8n
MCP_PORT=3030
MCP_HOST=0.0.0.0
PUBLIC_SITE_URL=https://moveisnascimento.voeagencia.com.br
N8N_DOCKER_NETWORK=n8n_default
```

O `SUPABASE_SERVICE_ROLE_KEY` e a chave secreta do Supabase. Nunca coloque essa chave no frontend, em um site publico ou em qualquer lugar acessivel por clientes.

O `MCP_AUTH_TOKEN` e um token forte que voce cria para o n8n conseguir acessar o MCP. Ele e obrigatorio e vai no header do MCP Client Tool.

## 3. Descobrir a network do n8n

No terminal da VPS, rode:

```bash
docker network ls
```

Procure uma rede relacionada ao n8n. Exemplos comuns:

```text
n8n_default
n8n
root_n8n
portainer_n8n_default
```

Se estiver em duvida, veja as redes do container do n8n:

```bash
docker inspect n8n --format '{{json .NetworkSettings.Networks}}'
```

Se o container do n8n tiver outro nome, veja os containers:

```bash
docker ps
```

Depois coloque o nome correto no `.env`:

```env
N8N_DOCKER_NETWORK=nome_da_rede_do_n8n
```

Assim o container `moveis-mcp` entra na mesma rede do n8n e o n8n consegue chamar `http://moveis-mcp_moveis-mcp:3030/sse`.

## 4. Criar Stack no Portainer

No Portainer:

1. Entre em `Stacks`.
2. Clique em `Add stack`.
3. Nome sugerido: `moveis-mcp`.
4. Cole o conteudo do `docker-compose.yml` ou use a opcao de upload/git, se preferir.
5. Em `Environment variables`, preencha as mesmas variaveis do `.env`, ou envie o arquivo `.env` junto com a Stack.
6. Clique em `Deploy the stack`.

Importante: mantenha a parte `ports` comentada. Assim o MCP nao fica publico por padrao.

## 5. Ver logs

Pelo Portainer:

1. Abra `Containers`.
2. Clique em `moveis-mcp`.
3. Abra `Logs`.

Ou pelo terminal:

```bash
docker logs -f moveis-mcp
```

Se estiver tudo certo, deve aparecer algo parecido com:

```text
MCP server listening on http://0.0.0.0:3030
SSE endpoint: http://0.0.0.0:3030/sse
Mode: direct Supabase REST
```

Se aparecer aviso de `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ou `MCP_AUTH_TOKEN`, revise o `.env`.

## 6. Testar dentro da VPS

Se o container estiver rodando, teste pela propria rede Docker:

```bash
docker exec -it moveis-mcp wget -qO- http://localhost:3030/health
```

Para testar a partir do container do n8n, entre no container do n8n e chame:

```bash
wget -qO- http://moveis-mcp:3030/health
```

Se retornar JSON com `ok: true` e `supabase_configured: true`, o MCP esta configurado.

## 7. Configurar no n8n

No workflow do n8n:

1. Adicione ou abra o node `AI Agent`.
2. Adicione um `MCP Client Tool`.
3. Conecte o `MCP Client Tool` ao `AI Agent`.
4. Configure:

```text
Transport: SSE
SSE URL: http://moveis-mcp_moveis-mcp:3030/sse
```

Header de autenticacao:

```text
Authorization: Bearer MCP_AUTH_TOKEN
```

Troque `MCP_AUTH_TOKEN` pelo valor real que voce colocou no `.env`.

Se o seu n8n mostrar a opcao `Streamable HTTP`, tambem existe o endpoint oficial:

```text
URL: http://moveis-mcp_moveis-mcp:3030/mcp
```

No Docker Swarm, use o nome DNS que respondeu ao teste dentro do container do n8n. Pelo seu teste, o correto e `moveis-mcp_moveis-mcp`.

## 8. Ferramentas disponiveis

- `search_products`: busca produtos ativos.
- `get_product_details`: consulta detalhes de produto.
- `register_customer_interest`: cria ou reutiliza lead e registra interesse.
- `add_lead_note`: adiciona nota na timeline.
- `request_human_attendant`: marca pedido de atendimento humano.
- `find_recent_orders_by_phone`: busca pedidos recentes pelo telefone.
- `get_order_status`: consulta status de pedido.
- `search_installers`: busca montadores ativos.

## 9. Prompt recomendado para o agente

```text
Use as ferramentas MCP quando precisar buscar produtos, consultar pedido, registrar interesse, adicionar nota no lead, chamar atendimento humano ou buscar montadores.

Nao invente preco, estoque, prazo ou status. Se a ferramenta nao retornar a informacao, diga que vai encaminhar ou pedir mais dados.

Quando o cliente demonstrar interesse real, use register_customer_interest.
Quando o cliente pedir humano ou o caso for sensivel, use request_human_attendant.
```

## Observacoes de seguranca

- Nao exponha a porta `3030` publicamente.
- Use `MCP_AUTH_TOKEN` forte.
- Proteja a `SUPABASE_SERVICE_ROLE_KEY`; ela tem permissao elevada no Supabase.
- Este MCP nao expoe exclusao, edicao de produtos ou mudancas administrativas sensiveis.
