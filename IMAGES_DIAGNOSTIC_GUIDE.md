# Guia de Diagnóstico de Imagens Legadas Quebradas

## Objetivo

Identificar exatamente por que imagens antigas continuam quebradas após o helper `resolveProductImageUrl()` gerar URLs públicas.

## Como Usar este Guia

### 1. Reproduzir o Problema

1. Abra o navegador em produção
2. Abra o Console do Desenvolvedor (F12)
3. Navegue até uma página de produto com imagens antigas quebradas
4. Procure pelos logs `[resolveProductImageUrl]`

### 2. Ler os Logs de Diagnóstico

O helper agora gera logs detalhados com esta estrutura:

```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: [valor do banco]
Path length: [tamanho em caracteres]
Starts with "/" ? [true/false]
Contains "product-images"? [true/false]
═══════════════════════════════════════════════════
```

### 3. Interpretar os Logs

#### Caso A: Path Começa com "/"

```
⚠️ Path começa com "/" - REMOVENDO
Path após remover "/": [novo path]
```

**Diagnóstico:** O path no banco começa com "/" (ex: `/produto-123.webp`)
**Problema:** O Supabase Storage não aceita paths com "/" inicial
**Solução:** O helper remove automaticamente, mas pode não ser suficiente se o arquivo estiver em local errado

#### Caso B: Path Contém Prefixo do Bucket

```
⚠️ Path contém prefixo do bucket - REMOVENDO
Path após remover bucket: [novo path]
```

**Diagnóstico:** O path no banco tem prefixo (ex: `product-images/arquivo.webp`)
**Problema:** Isso pode indicar que o path foi salvo com o nome do bucket
**Solução:** O helper remove, mas pode estar no bucket errado

#### Caso C: Tentando Múltiplos Buckets

```
📦 Tentando bucket: "product-images"
✅ Success with bucket="product-images" path="[path]"
URL: [URL gerada]
```

**Diagnóstico:** O helper encontrou o arquivo e gerou URL com sucesso
**Problema:** Se a URL ainda quebra, o arquivo pode não ser acessível publicamente

#### Caso D: Falha em Todos os Buckets

```
❌ FALHA TOTAL - Nenhum bucket funcionou
Original path: [valor]
Normalized path: [valor]
```

**Diagnóstico:** O arquivo não foi encontrado em NENHUM bucket testado
**Causas prováveis:**
1. Arquivo foi deletado do Storage
2. Arquivo está em um bucket não listado
3. Nome do arquivo no banco está incorreto
4. Arquivo está em uma subpasta não contemplada

### 4. Verificar no Supabase Storage

Após ler os logs, vá ao Supabase Console:

1. Acesse: Storage → Buckets
2. Para cada bucket listado no código (`product-images`, `products`, `images`, `produtos`):
   - Clique no bucket
   - Procure pelo nome do arquivo que aparece nos logs
   - Anote exatamente onde está o arquivo

### 5. Testar URLs Manualmente

Copie a URL gerada e cole diretamente no navegador:

- **200 OK:** Arquivo existe e é acessível publicamente → problema é no frontend
- **403 Forbidden:** Arquivo existe mas RLS/políticas bloqueiam acesso → verificar políticas do bucket
- **404 Not Found:** Arquivo não existe nesse local → arquivo está em outro bucket/path

## Exemplos de Logs e Interpretação

### Exemplo 1: Path com "/" inicial

```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: /produto-123.webp
Path length: 18
Starts with "/" ? true
Contains "product-images"? false
═══════════════════════════════════════════════════
⚠️ Path começa com "/" - REMOVENDO
Path após remover "/": produto-123.webp
═══════════════════════════════════════════════════
🎯 Tentando resolução com path normalizado: produto-123.webp
═══════════════════════════════════════════════════
📦 Tentando bucket: "product-images"
✅ Success with bucket="product-images" path="produto-123.webp"
URL: https://.../storage/v1/object/public/product-images/produto-123.webp
```

**Interpretação:** ✅ Sucesso! Path tinha "/" inicial, foi removido, arquivo encontrado.

### Exemplo 2: Falha em todos os buckets

```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
Path length: 51
Starts with "/" ? false
Contains "product-images"? false
═══════════════════════════════════════════════════
🎯 Tentando resolução com path normalizado: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
═══════════════════════════════════════════════════
📦 Tentando bucket: "product-images"
❌ Failed with bucket="product-images" path="1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png"
📦 Tentando bucket: "products"
❌ Failed with bucket="products" path="1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png"
📦 Tentando bucket: "images"
❌ Failed with bucket="images" path="1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png"
📦 Tentando bucket: "produtos"
❌ Failed with bucket="produtos" path="1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png"
❌ FALHA TOTAL - Nenhum bucket funcionou
Original path: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
Normalized path: 1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
Verifique se:
  1. O arquivo existe no Supabase Storage
  2. O bucket está correto
  3. O nome do arquivo está correto
```

**Interpretação:** ❌ Arquivo não encontrado em nenhum bucket
**Ação:** Verificar no Supabase Storage se o arquivo existe em algum outro bucket ou foi deletado

### Exemplo 3: Arquivo em subpasta

```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: /produtos/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
Path length: 60
Starts with "/" ? true
Contains "product-images"? false
═══════════════════════════════════════════════════
⚠️ Path começa com "/" - REMOVENDO
Path após remover "/": produtos/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
═══════════════════════════════════════════════════
🎯 Tentando resolução com path normalizado: produtos/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
═══════════════════════════════════════════════════
📦 Tentando bucket: "product-images"
✅ Success with bucket="product-images" path="produtos/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png"
URL: https://.../storage/v1/object/public/product-images/produtos/1775825654564-8dfd9ba-2cbe-459b-86e0-60a1b3b23267.png
```

**Interpretação:** ✅ Sucesso! Arquivo estava na subpasta `produtos/` dentro do bucket `product-images`

## Ações Corretivas Possíveis

### Se Arquivo Existe mas URL Quebra (403 Forbidden)

**Problema:** Bucket tem RLS/políticas bloqueando acesso público

**Solução:**
1. Acesse Supabase Console → Storage → bucket
2. Verifique as políticas de acesso (policies)
3. Certifique-se que o bucket permite acesso público (public bucket)
4. Ou adicione política RLS para leitura pública

### Se Arquivo Está em Bucket Não Listado

**Problema:** Arquivo está em bucket não incluído na lista `POSSIBLE_BUCKETS`

**Solução:**
1. Identifique o nome correto do bucket no Supabase Console
2. Adicione o bucket ao array `POSSIBLE_BUCKETS` no código:
```typescript
const POSSIBLE_BUCKETS = [
  'product-images',
  'products',
  'images',
  'produtos',
  'seu-bucket-legado', // ← adicionar aqui
];
```

### Se Arquivo Foi Deletado

**Problema:** Arquivo não existe mais no Storage

**Solução:**
1. Opção A: Re-upload do arquivo legado para o bucket correto
2. Opção B: Atualizar o banco com URL completa se o arquivo foi movido para CDN externo
3. Opção C: Atualizar com placeholder se o arquivo foi perdido permanentemente

### Se Path no Banco Está Incorreto

**Problema:** Nome do arquivo no banco não bate com nome no Storage

**Solução:**
1. Execute query para atualizar paths no banco:
```sql
-- Exemplo: adicionar prefixo de subpasta
UPDATE products
SET images = ARRAY(
  SELECT 'produtos/' || img 
  FROM unnest(images) AS img
)
WHERE id = 'produto-id-aqui';
```

## Próximos Passos

1. **Cole os logs do console** aqui para análise
2. **Verifique no Supabase Storage** onde estão os arquivos antigos
3. **Teste as URLs geradas** no navegador para ver o código HTTP (200/403/404)
4. Com base no diagnóstico, podemos ajustar o código ou executar uma migração de dados
