# Patch de Hardening - Validação de Nomes de Imagem

## Objetivo

Evitar que imagens com nome inválido/quebrado sejam renderizadas na página de produto, melhorando a UX e facilitando debug futuro.

## Validações Implementadas

### 1. Validação de Extensão

Apenas extensões de imagem permitidas são aceitas:
- ✅ `.jpg` / `.jpeg`
- ✅ `.png`
- ✅ `.webp`
- ✅ `.gif`
- ✅ `.svg`

**Exemplo de rejeição:**
```javascript
Invalid image path: no valid extension
Path: produto.docx
Allowed extensions: .jpg, .jpeg, .png, .webp, .gif, .svg
```

### 2. Validação de Tamanho

**Tamanho mínimo:** 5 caracteres
**Tamanho máximo:** 500 caracteres

**Exemplos de rejeição:**
```javascript
// Muito curto
Invalid image path: too short
Path: a.jpg
Length: 5

// Muito longo
Invalid image path: too long
Path: [string de 501+ caracteres]
Length: 512
```

### 3. Detecção de Padrões Suspeitos

Detecta strings concatenadas ou formatos inválidos:

**Exemplos de rejeição:**
```javascript
// Espaços consecutivos excessivos
Invalid image path: suspicious consecutive spaces
Path: produto   .jpg

// Extensões concatenadas (indica corrupção)
Invalid image path: suspicious concatenated extensions
Path: arquivo.jpgfile2.png
```

### 4. Validação de Caracteres Inválidos

Caracteres inválidos em nomes de arquivo são rejeitados:
- ❌ `\` (backslash)
- ❌ `:` (dois pontos)
- ❌ `*` (asterisco)
- ❌ `?` (interrogação)
- ❌ `"` (aspas)
- ❌ `<` (menor que)
- ❌ `>` (maior que)
- ❌ `|` (pipe)

**Observação:** `/` é permitido pois pode indicar subpastas válidas (`produtos/arquivo.jpg`)

**Exemplo de rejeição:**
```javascript
Invalid image path: invalid characters
Path: arquivo:teste.jpg
```

### 5. Validação de Whitespace

Rejeita strings que contêm apenas espaços em branco:
```javascript
Invalid image path: whitespace only
Path: "    "
```

## Fluxo de Validação

```
1. Recebe path do banco
   ↓
2. Aplica trim
   ↓
3. Verifica se está vazio
   ↓
4. Se for URL completa → retorna direto
   ↓
5. ❌ VALIDAÇÃO DE SEGURANÇA
   ↓
   ├─ Verifica extensão
   ├─ Verifica tamanho (min/max)
   ├─ Detecta padrões suspeitos
   ├─ Verifica caracteres inválidos
   └─ Verifica whitespace
   ↓
6. Se INVÁLIDO → retorna '' (placeholder)
   ↓
7. Se VÁLIDO → tenta resolver URL
```

## Logs de Validação

### Sucesso

```javascript
[resolveProductImageUrl] 🔍 DIAGNÓSTICO INICIADO
Original path: produto-123.jpg
Path length: 16
Starts with "/" ? false
Contains "product-images"? false
...
📦 Tentando bucket: "product-images"
✅ Success with bucket="product-images" path="produto-123.jpg"
URL: https://.../public/product-images/produto-123.jpg
```

### Falha por Extensão Inválida

```javascript
═══════════════════════════════════════════════════
[resolveProductImageUrl] ❌ INVALID IMAGE PATH DETECTED
Path: documento.docx
Image will NOT be rendered - using placeholder
═══════════════════════════════════════════════════

[resolveProductImageUrl] ❌ Invalid image path: no valid extension
{
  path: "documento.docx",
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]
}
```

### Falha por Tamanho

```javascript
[resolveProductImageUrl] ❌ Invalid image path: too short
{ path: "a.jpg", length: 5 }
```

### Falha por Padrão Suspeito

```javascript
[resolveProductImageUrl] ❌ Invalid image path: suspicious consecutive spaces
{ path: "produto   .jpg" }

[resolveProductImageUrl] ❌ Invalid image path: suspicious concatenated extensions
{ path: "arquivo.jpgfile2.png" }
```

### Falha por Caracteres Inválidos

```javascript
[resolveProductImageUrl] ❌ Invalid image path: invalid characters
{ path: "arquivo:teste.jpg" }
```

## Comportamento de Fallback

Quando uma imagem é detectada como inválida:

1. **Helper retorna string vazia** `''`
2. **Componente renderiza placeholder**
3. **UX é preservada** (não quebra a página)
4. **Log detalhado** é gerado para debug

### Exemplo no Componente

```tsx
{mainImageUrl ? (
  <img
    src={mainImageUrl}
    alt={product.name}
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
    Sem imagem
  </div>
)}
```

## Casos de Uso

### ✅ Casos Válidos

| Path | Status |
|------|--------|
| `produto-123.jpg` | ✅ Válido |
| `/produtos/arquivo.png` | ✅ Válido (remove "/") |
| `imagem-teste-001.webp` | ✅ Válido |
| `photos/photo01.svg` | ✅ Válido (subpasta) |
| `https://cdn.exemplo.com/img.jpg` | ✅ Válido (URL completa) |

### ❌ Casos Inválidos

| Path | Motivo |
|------|--------|
| `documento.docx` | ❌ Extensão inválida |
| `a.jpg` | ❌ Muito curto (5 chars) |
| `produto   .jpg` | ❌ Espaços consecutivos |
| `file.jpgfile2.png` | ❌ Extensões concatenadas |
| `arquivo:teste.jpg` | ❌ Caractere inválido `:` |
| `       ` | ❌ Whitespace apenas |

## Benefícios

### 1. Prevenção de Erros
- ❌ Evita tentativas de carregar arquivos que não são imagens
- ❌ Evita quebras na interface por nomes corrompidos

### 2. Melhor UX
- ✅ Usuário vê placeholder instead de broken image
- ✅ Continua podendo usar o site normalmente

### 3. Debug Facilitado
- 📊 Logs claros indicam exatamente o problema
- 🔍 Possível identificar padrões de corrupção no banco

### 4. Manutenção
- 🔧 Centraliza validações em um único lugar
- 📝 Regras documentadas e fáceis de ajustar

## Exemplo de Log Completo (Caso de Falha)

```
═══════════════════════════════════════════════════
[resolveProductImageUrl] ❌ INVALID IMAGE PATH DETECTED
Path: arquivo-corrompido.jpgfile2.png
Image will NOT be rendered - using placeholder
═══════════════════════════════════════════════════

[resolveProductImageUrl] ❌ Invalid image path: suspicious concatenated extensions
{
  path: "arquivo-corrompido.jpgfile2.png"
}
```

## Configurações

**Para ajustar as validações, modifique as constantes no topo do arquivo:**

```typescript
// Extensões permitidas
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Tamanho do nome do arquivo
const MAX_FILENAME_LENGTH = 500;
const MIN_FILENAME_LENGTH = 5;
```

## Testes Sugeridos

1. **Teste com extensão inválida:**
   - Acesse um produto com imagem `.docx`
   - Deve mostrar placeholder e log de erro

2. **Teste com tamanho inválido:**
   - Simule path muito curto ou muito longo
   - Deve rejeitar e logar

3. **Teste com padrões suspeitos:**
   - Simule path com espaços excessivos
   - Simulate path com extensões concatenadas

4. **Teste com caracteres inválidos:**
   - Simule path com `:`, `*`, `?`, etc.
   - Deve rejeitar e logar

## Regras de Patch Controlado Seguidas

✅ NÃO alterou modelagem do banco
✅ NÃO mexeu no CRM
✅ NÃO reescreveu a página inteira
✅ Foco em validação e segurança
✅ Logs detalhados para diagnóstico
✅ Fallback seguro para UX

## Próximos Passos

Após identificar padrões de corrupção nos logs:

1. **Analisar logs** em produção
2. **Identificar padrões** de corrupção
3. **Planejar migração** se necessário
4. **Remover ou ajustar** logs temporários
