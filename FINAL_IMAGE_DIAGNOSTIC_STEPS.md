# Diagnóstico Final - Validar URL Gerada de Imagem Quebrada

## Objetivo

Confirmar se a URL pública gerada para uma imagem antiga quebrada realmente retorna uma imagem válida ou se o problema é arquivo ausente/nome divergente.

## Passo 1: Identificar uma Imagem Quebrada

### A. No Navegador (Produção)

1. Abra o site em produção
2. Acesse uma página de produto com imagens quebradas
3. Abra o Console do Desenvolvedor (F12)
4. Procure por logs `[resolveProductImageUrl]`
5. Encontre um log de **FALHA** ou log de sucesso com URL

### B. Exemplo de Log de Sucesso com URL

```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: /produto-123.jpg
Path length: 16
Starts with "/" ? true
═══════════════════════════════════════════════════
⚠️ Path começa com "/" - REMOVENDO
Path após remover "/": produto-123.jpg
═══════════════════════════════════════════════════
📦 Tentando bucket: "product-images"
✅ Success with bucket="product-images" path="produto-123.jpg"
URL: https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/product-images/produto-123.jpg
═══════════════════════════════════════════════════
```

### C. Exemplo de Log de Falha

```
═══════════════════════════════════════════════════
❌ INVALID IMAGE PATH DETECTED
Path: arquivo-corrompido.docx
Image will NOT be rendered - using placeholder
═══════════════════════════════════════════════════
```

---

## Passo 2: Testar a URL no Navegador

### A. Copiar a URL

Do log de sucesso, copie a URL:
```
https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/product-images/produto-123.jpg
```

### B. Abrir em Nova Aba

1. Abra uma nova aba do navegador
2. Cole a URL
3. Pressione Enter

### C. Registrar o Resultado

#### Resultado Possível 1: ✅ Imagem Carrega
- **Comportamento:** Imagem aparece normalmente
- **Código HTTP:** 200 OK
- **Diagnóstico:** URL está correta, problema pode ser no componente React
- **Ação:** Verificar se a imagem está sendo renderizada corretamente no ProductDetail

#### Resultado Possível 2: ❌ Erro 403 Forbidden
- **Comportamento:** Mensagem de acesso negado ou XML
- **Código HTTP:** 403 Forbidden
- **Diagnóstico:** Arquivo existe mas políticas de acesso bloqueiam
- **Ação:** Verificar RLS/políticas do bucket no Supabase Console

**Exemplo de resposta 403:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```

#### Resultado Possível 3: ❌ Erro 404 Not Found
- **Comportamento:** "Not Found" ou erro genérico
- **Código HTTP:** 404 Not Found
- **Diagnóstico:** Arquivo não existe nesse local
- **Ação:** Procurar arquivo no Supabase Storage

**Exemplo de resposta 404:**
```json
{"statusCode":"404","error":"Not Found","message":"The resource was not found"}
```

#### Resultado Possível 4: ❌ XML de Erro do Supabase
- **Comportamento:** Página XML com erro
- **Código HTTP:** Pode variar
- **Diagnóstico:** Supabase retornou erro específico
- **Ação:** Ler mensagem de erro no XML

**Exemplo de XML de erro:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchKey</Code>
  <Message>The specified key does not exist</Message>
  <Key>produto-123.jpg</Key>
</Error>
```

---

## Passo 3: Verificar no Supabase Storage

### A. Acessar Supabase Console

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `kbpkdnptzvsvoujirfwe`
3. Vá para: **Storage** → **Buckets**

### B. Verificar Bucket `product-images`

1. Clique no bucket `product-images`
2. Procure pelo nome do arquivo dos logs

**Arquivo existe?**

#### ✅ SIM - Arquivo Encontrado

**Verificar:**
- Nome está **EXATAMENTE** igual ao path dos logs?
- Está na raiz ou em subpasta?
- Tamanho do arquivo é maior que 0 bytes?

**Se nome está diferente:**
- Anote o nome real no Supabase
- Compare com o path no banco de dados
- Identifique a diferença (ex: `-` vs `_`, maiúsculas vs minúsculas)

**Se está em subpasta:**
- Anote o path completo (ex: `produtos/arquivo.jpg`)
- Compare com o path no banco
- Ajuste a normalização se necessário

#### ❌ NÃO - Arquivo NÃO Encontrado

**Possíveis causas:**
1. Arquivo foi deletado
2. Arquivo está em outro bucket
3. Nome no banco está incorreto
4. Arquivo nunca foi upado para o Storage

**Ações:**

**Opção A: Verificar outros buckets**
- Procurar o mesmo nome em:
  - `products`
  - `images`
  - `produtos`

**Opção B: Consultar banco de dados**
```sql
-- Verificar o path salvo no banco
SELECT 
  id,
  name,
  images,
  created_at
FROM products
WHERE id = 'ID_DO_PRODUTO_AQUI';
```

**Opção C: Verificar logs de upload**
- Se há histórico de quando o arquivo foi upado
- Se houve migração de storage

---

## Passo 4: Cruzar Informações

### A. Preencher Tabela de Diagnóstico

| Item | Valor |
|------|-------|
| **Path do banco** | (copiar dos logs) |
| **URL gerada** | (copiar dos logs) |
| **Código HTTP** | (200 / 403 / 404) |
| **Arquivo existe no Storage?** | (SIM / NÃO) |
| **Bucket correto?** | (SIM / NÃO) |
| **Nome bate exatamente?** | (SIM / NÃO) |
| **Subpasta?** | (SIM / NÃO - qual?) |

### B. Analisar Padrões

**Padrão 1: URL Correta + Imagem Quebra**
- Código HTTP: 200
- Imagem abre direto
- **Diagnóstico:** Problema no componente React
- **Solução:** Investigar ProductDetail.tsx

**Padrão 2: 403 Forbidden + Arquivo Existe**
- Código HTTP: 403
- Arquivo existe no Storage
- **Diagnóstico:** Política de acesso bloqueando
- **Solução:** Ajustar RLS/políticas do bucket

**Padrão 3: 404 Not Found + Arquivo Ausente**
- Código HTTP: 404
- Arquivo NÃO existe no Storage
- **Diagnóstico:** Arquivo deletado ou nunca existiu
- **Solução:** Re-upload ou atualizar banco

**Padrão 4: 404 Not Found + Nome Divergente**
- Código HTTP: 404
- Arquivo existe mas com nome diferente
- **Diagnóstico:** Path no banco está incorreto
- **Solução:** Migrar dados no banco

**Padrão 5: Arquivo em Outro Bucket**
- Código HTTP: 404
- Arquivo existe em bucket diferente
- **Diagnóstico:** Bucket errado no helper
- **Solução:** Adicionar bucket a `POSSIBLE_BUCKETS`

---

## Passo 5: Reportar Resultados

### A. Fornecer as Informações

Por favor, forneça:

1. **Log do console** de uma imagem quebrada
2. **URL gerada** pelo helper
3. **Resultado ao abrir a URL** (200 / 403 / 404 / erro)
4. **Status do arquivo** no Supabase Storage (existe? qual bucket?)
5. **Nome real** do arquivo se existir

### B. Exemplo de Report

```
LOG DO CONSOLE:
[resolveProductImageUrl] Original path: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
...
URL GERADA: https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/product-images/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png

RESULTADO NO NAVEGADOR:
404 Not Found

ARQUIVO NO STORAGE:
NÃO encontrado em bucket product-images
Encontrado em bucket: products
Nome real: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
```

---

## Resumo de Cenários Possíveis

### Cenário 1: Problema de Renderização (Componente)

**Sinais:**
- ✅ URL abre no navegador
- ✅ Código HTTP 200
- ❌ Imagem não aparece no ProductDetail

**Solução:**
- Investigar se o componente está recebendo a URL
- Verificar se há erro no componente `<img>`
- Checar se há CSS ocultando a imagem

### Cenário 2: Problema de Permissão (403)

**Sinais:**
- ❌ URL retorna 403 Forbidden
- ✅ Arquivo existe no Storage

**Solução:**
- Acessar Supabase Console → Storage → bucket
- Verificar se é "public bucket"
- Ajustar políticas RLS se necessário

### Cenário 3: Problema de Arquivo Ausente (404)

**Sinais:**
- ❌ URL retorna 404 Not Found
- ❌ Arquivo NÃO existe no Storage

**Solução:**
- Re-upload dos arquivos antigos
- OU atualizar banco com placeholder
- OU migrar para CDN externo

### Cenário 4: Problema de Bucket Errado

**Sinais:**
- ❌ URL retorna 404 Not Found
- ✅ Arquivo existe em bucket DIFERENTE

**Solução:**
```typescript
// Adicionar bucket ao array POSSIBLE_BUCKETS
const POSSIBLE_BUCKETS = [
  'product-images',
  'products',        // ← adicionar este
  'images',          // ← ou este
];
```

### Cenário 5: Problema de Path Divergente

**Sinais:**
- ❌ URL retorna 404 Not Found
- ✅ Arquivo existe com nome DIFERENTE

**Exemplo:**
- Banco: `produto-123.jpg`
- Storage: `Produto_123.JPG`

**Solução:**
```sql
-- Atualizar paths no banco
UPDATE products
SET images = ARRAY(
  SELECT REPLACE(img, 'produto-123.jpg', 'Produto_123.JPG')
  FROM unnest(images) AS img
)
WHERE id = 'id-do-produto';
```

---

## Checklist de Diagnóstico

- [ ] Copiei uma URL gerada pelo helper
- [ ] Abri a URL no navegador
- [ ] Registrei o código HTTP (200/403/404)
- [ ] Verifiquei se o arquivo existe no Supabase Storage
- [ ] Confirmei em qual bucket está
- [ ] Comparei nome exato do arquivo
- [ ] Identifiquei se está em subpasta
- [ ] Preenchi a tabela de diagnóstico
- [ ] Reportei os resultados

---

## Próximos Passos Após Diagnóstico

### Se problema for COMPONENTE:
- Investigar ProductDetail.tsx
- Verificar se URL está sendo usada
- Checar erros no console do navegador

### Se problema for PERMISSÃO (403):
- Ajustar políticas do bucket
- Tornar bucket público se necessário

### Se problema for ARQUIVO AUSENTE (404):
- Re-upload dos arquivos
- OU atualizar banco com placeholder
- OU remover imagem do array

### Se problema for BUCKET ERRADO:
- Adicionar bucket a `POSSIBLE_BUCKETS`

### Se problema for PATH DIVERGENTE:
- Migrar dados no banco
- OU ajustar normalização de paths
