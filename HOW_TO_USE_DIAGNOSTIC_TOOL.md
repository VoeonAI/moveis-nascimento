# Como Usar a Ferramenta de Diagnóstico de Imagens

## Acesso

Abra a ferramenta em:
```
https://[seu-domínio]/diagnostic-images
```

## Visão Geral

Esta ferramenta carrega produtos do banco de dados e testa automaticamente todas as URLs de imagens, identificando problemas de carregamento.

## Como Usar

### Passo 1: Abrir a Ferramenta

1. Acesse: `/diagnostic-images`
2. Aguarde o carregamento dos produtos
3. Você verá uma lista de produtos carregados

### Passo 2: Executar Testes

Clique no botão **"Testar Todas as Imagens"**

A ferramenta vai:
- ✅ Carregar até 10 produtos
- ✅ Coletar todos os paths de imagens (do produto, variações, etc.)
- ✅ Usar o helper `resolveProductImageUrl()` para gerar URLs
- ✅ Testar cada URL via fetch
- ✅ Exibir resultados com status OK/ERRO

### Passo 3: Analisar Resultados

#### Resultado OK (Verde)

```
✅ OK
✅ Sucesso!
URL gerada e rede respondeu sem erros.

Próximo passo: Se a imagem ainda não aparece no ProductDetail,
o problema pode ser no componente React.
```

**O que fazer:**
1. Clique em **"Abrir em nova aba"** para ver a imagem
2. Se a imagem abre, o problema está no ProductDetail.tsx
3. Verifique se o componente está recebendo a URL corretamente

#### Resultado ERRO (Vermelho)

```
❌ ERRO
Problema detectado:
O helper não conseguiu gerar uma URL pública para este path.

Ação: Abra o console do navegador para ver logs detalhados de diagnóstico.
```

**O que fazer:**
1. Abra o console do navegador (F12)
2. Procure por logs `[resolveProductImageUrl]`
3. Leia os logs de diagnóstico para identificar o problema
4. Consulte o guia `FINAL_IMAGE_DIAGNOSTIC_STEPS.md`

### Passo 4: Ações Corretivas

#### Caso 1: URL OK mas Imagem não aparece no ProductDetail

**Sintomas:**
- ✅ Ferramenta mostra OK (verde)
- ✅ "Abrir em nova aba" mostra a imagem
- ❌ Imagem não aparece na página de produto

**Diagnóstico:** Problema no componente React

**Soluções:**

1. **Verificar se o componente está recebendo a URL:**
```tsx
// No ProductDetail.tsx
console.log('[ProductDetail] Main image URL:', mainImageUrl);
```

2. **Verificar se há erro no elemento `<img>`:**
```tsx
{mainImageUrl ? (
  <img
    src={mainImageUrl}
    alt={product.name}
    onError={(e) => {
      console.error('[ProductDetail] Image error:', e);
      console.error('[ProductDetail] Image URL:', mainImageUrl);
    }}
    onLoad={() => {
      console.log('[ProductDetail] Image loaded successfully');
    }}
  />
) : (
  <div>Sem imagem</div>
)}
```

3. **Verificar CSS:**
- A imagem está sendo ocultada?
- Há `display: none` ou `visibility: hidden`?

#### Caso 2: Helper não gera URL

**Sintomas:**
- ❌ Ferramenta mostra ERRO (vermelelho)
- ❌ Mensagem: "O helper não conseguiu gerar uma URL pública"

**Diagnóstico:** Path inválido ou arquivo não encontrado

**Soluções:**

1. **Abrir console e ler logs:**
   - Procure `[resolveProductImageUrl]`
   - Identifique se é:
     - Path inválido (validação rejeitou)
     - Arquivo não encontrado em nenhum bucket

2. **Validação rejeitou:**
   - Verifique se tem extensão válida (.jpg, .png, etc.)
   - Verifique tamanho do nome (5-500 caracteres)
   - Verifique caracteres inválidos

3. **Arquivo não encontrado:**
   - Acesse Supabase Storage
   - Procure o arquivo nos buckets
   - Re-up ou atualize banco

#### Caso 3: Erro de rede

**Sintomas:**
- ❌ Ferramenta mostra ERRO (vermelelho)
- ❌ Mensagem: "Ocorreu um erro ao tentar carregar a imagem via rede"

**Diagnóstico:** URL incorreta ou problema de acesso

**Soluções:**

1. **Testar URL manualmente:**
   - Clique em "Copiar URL"
   - Cole em nova aba
   - Veja código HTTP (200 / 403 / 404)

2. **403 Forbidden:**
   - Ajustar políticas do bucket no Supabase
   - Verificar se bucket é público

3. **404 Not Found:**
   - Arquivo não existe nesse local
   - Bucket errado
   - Path divergente

## Exemplos de Diagnóstico

### Exemplo 1: Imagem Funciona

```
Produto: Sofá Moderno
Path original: sofa-moderno.jpg
URL resolvida: https://.../product-images/sofa-moderno.jpg

Status: ✅ OK
✅ Sucesso!
```

**Interpretação:** Tudo funcionando, não há problema.

**Ação:** Nenhuma necessária.

---

### Exemplo 2: Path Inválido

```
Produto: Mesa de Jantar
Path original: documento.docx
URL resolvida: NOT RESOLVED

Status: ❌ ERRO
O helper não conseguiu gerar uma URL pública.
```

**Console:**
```
❌ INVALID IMAGE PATH DETECTED
Path: documento.docx

❌ Invalid image path: no valid extension
{
  path: "documento.docx",
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]
}
```

**Interpretação:** Path tem extensão inválida.

**Ação:** Atualizar banco com nome correto ou remover do array.

---

### Exemplo 3: Arquivo Não Encontrado

```
Produto: Cadeira de Escritório
Path original: cadeira.jpg
URL resolvida: https://.../product-images/cadeira.jpg

Status: ❌ ERRO
Ocorreu um erro ao tentar carregar a imagem via rede.
```

**Console:**
```
═══════════════════════════════════════════════════
🔍 DIAGNÓSTICO INICIADO
Original path: cadeira.jpg
...
📦 Tentando bucket: "product-images"
❌ Failed with bucket="product-images" path="cadeira.jpg"
📦 Tentando bucket: "products"
❌ Failed with bucket="products" path="cadeira.jpg"
...
❌ FALHA TOTAL - Nenhum bucket funcionou
```

**Interpretação:** Arquivo não encontrado em nenhum bucket.

**Ação:** 
1. Verificar Supabase Storage
2. Re-up do arquivo
3. OU atualizar banco com placeholder

---

### Exemplo 4: Bucket Errado

```
Produto: Estante de Livros
Path original: estante.png
URL resolvida: https://.../product-images/estante.png

Status: ❌ ERRO
Ocorreu um erro ao tentar carregar a imagem via rede.
```

**Console:**
```
❌ FALHA TOTAL - Nenhum bucket funcionou
```

**Verificando no Supabase Storage:**
- ❌ Não encontrado em `product-images`
- ❌ Não encontrado em `products`
- ✅ Encontrado em bucket `images`

**Interpretação:** Arquivo existe, mas em bucket não listado.

**Ação:** Adicionar bucket ao array `POSSIBLE_BUCKETS`:
```typescript
const POSSIBLE_BUCKETS = [
  'product-images',
  'products',
  'images',  // ← adicionar este
  'produtos',
];
```

---

## Resumo de Ações

| Resultado | Ação |
|-----------|------|
| ✅ OK + Imagem abre no ProductDetail | Tudo funcionando |
| ✅ OK + Imagem NÃO abre no ProductDetail | Investigar componente React |
| ❌ Helper não gera URL + Validção rejeitou | Atualizar/remover path no banco |
| ❌ Helper não gera URL + Arquivo não encontrado | Re-up ou atualizar banco |
| ❌ Erro de rede + 403 Forbidden | Ajustar políticas do bucket |
| ❌ Erro de rede + 404 Not Found | Verificar bucket/path |
| ❌ Erro de rede + Arquivo em outro bucket | Adicionar bucket à lista |

## Próximos Passos Após Diagnóstico

1. **Use a ferramenta** em `/diagnostic-images`
2. **Identifique padrões** de erro
3. **Consulte o console** para logs detalhados
4. **Aplique as correções** conforme o tipo de erro
5. **Teste novamente** na ferramenta
6. **Verifique no ProductDetail** se imagens aparecem

## Documentação Relacionada

- `FINAL_IMAGE_DIAGNOSTIC_STEPS.md` - Guia passo-a-passo detalhado
- `IMAGE_VALIDATION_HARDENING.md` - Validações implementadas
- `IMAGE_URL_NORMALIZATION.md` - Helper de normalização
