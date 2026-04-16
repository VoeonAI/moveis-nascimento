# ANÁLISE DE POLICIES — BUCKET product-images

## OBJETIVO
Revisar policies do bucket `product-images` para identificar exposição desnecessária.

## DATA
2025-01-17

---

## CONFIGURAÇÃO ATUAL

### Bucket `product-images`

```sql
{
  "id": "product-images",
  "name": "product-images",
  "public": true,
  "file_size_limit": 10485760,  // 10MB
  "allowed_mime_types": ["image/*"],
  "created_at": "2026-03-03 13:54:23.209784+00"
}
```

**Observações:**
- ✅ Bucket marcado como público (`public: true`)
- ✅ Limite de tamanho: 10MB
- ✅ Apenas imagens permitidas (`image/*`)

---

## POLICIES DO BUCKET `product-images`

### 1. Public read product images

```sql
CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images'::text);
```

**Análise:**
- **Comando:** SELECT
- **Roles:** `public` (qualquer pessoa)
- **Qualificator:** Apenas bucket `product-images`
- **Necessária:** ✅ **SIM**

**Por que é necessária:**
1. URLs públicas do Supabase Storage funcionam sem autenticação
2. A página pública precisa carregar imagens sem login
3. O helper `getPublicUrl()` gera URLs que dependem desta policy
4. Sem esta policy, as imagens não carregariam no site público

---

### 2. Internal upload product images

```sql
CREATE POLICY "Internal upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ((bucket_id = 'product-images'::text) AND has_internal_role());
```

**Análise:**
- **Comando:** INSERT (upload)
- **Roles:** `authenticated` (usuários logados)
- **With Check:** Requer `has_internal_role()`
- **Segura:** ✅ **SIM**

**Por que é segura:**
- Apenas usuários autenticados podem fazer upload
- Upload restrito a usuários com `has_internal_role()`
- Função `has_internal_role()` é um verificador de permissão interna

---

### 3. Internal update product images

```sql
CREATE POLICY "Internal update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'product-images'::text) AND has_internal_role());
```

**Análise:**
- **Comando:** UPDATE
- **Roles:** `authenticated`
- **Using:** Requer `has_internal_role()`
- **Segura:** ✅ **SIM**

**Por que é segura:**
- Apenas usuários autenticados podem atualizar
- Atualização restrita a usuários com `has_internal_role()`

---

### 4. Internal delete product images

```sql
CREATE POLICY "Internal delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'product-images'::text) AND has_internal_role());
```

**Análise:**
- **Comando:** DELETE
- **Roles:** `authenticated`
- **Using:** Requer `has_internal_role()`
- **Segura:** ✅ **SIM**

**Por que é segura:**
- Apenas usuários autenticados podem deletar
- Deleção restrita a usuários com `has_internal_role()`

---

## VERIFICAÇÃO DE POLICIES DE LISTAGEM

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND cmd = 'LIST';
```

**Resultado:**
```
[]
```

**Conclusão:**
- ✅ **Não há policy de LIST** para nenhum bucket
- ✅ Não é possível listar todos os arquivos publicamente
- ✅ Isso é excelente para segurança

---

## AVALIAÇÃO DE SEGURANÇA

### ✅ O Que Está Correto

1. **Leitura Pública Necessária:**
   - ✅ Policy de SELECT público é necessária para o site funcionar
   - ✅ Sem ela, imagens não carregariam na página pública
   - ✅ Restrita ao bucket `product-images` (não afeta outros buckets)

2. **Escrita Segura:**
   - ✅ INSERT/UPDATE/DELETE restritos a usuários autenticados
   - ✅ Requer `has_internal_role()` (verificação adicional)
   - ✅ Não há escrita pública

3. **Sem Listagem Pública:**
   - ✅ Não há policy de LIST
   - ✅ Não é possível listar todos os arquivos
   - ✅ Imagens só são acessíveis via URL direta (conhecendo o path)

4. **Restrições do Bucket:**
   - ✅ MIME types limitados a `image/*`
   - ✅ Limite de tamanho: 10MB
   - ✅ Previne upload de arquivos não permitidos

### ⚠️ O Que Pode Ser Considerado "Exposição"

1. **Bucket Público:**
   - ⚠️ `public: true` permite que qualquer pessoa acesse arquivos pela URL
   - ⚠️ URLs são previsíveis (baseadas em timestamp + nome)
   - ⚠️ Alguém pode tentar bruteforce paths

2. **Leitura Pública:**
   - ⚠️ Qualquer pessoa pode acessar qualquer imagem se tiver a URL
   - ⚠️ URLs ficam permanentemente públicas
   - ⚠️ Não há proteção por sessão ou token

### 🤔 Isso é Problema?

**Para este caso de uso: NÃO.**

**Por que:**
1. **As imagens são públicas por design:**
   - O site é um catálogo público
   - Imagens de produtos precisam ser acessíveis por todos
   - Não há conteúdo sensível nas imagens

2. **Não há listagem pública:**
   - Alguém não pode listar todos os arquivos
   - Precisa saber o path exato para acessar uma imagem
   - Paths não são facilmente previsíveis (timestamp + nome original)

3. **Risco é baixo:**
   - O impacto de acessar uma imagem de produto é mínimo
   - Não há informações sensíveis
   - O benefício (site funcional) supera o risco

4. **Padrão do Supabase Storage:**
   - Buckets públicos são comuns para ativos estáticos
   - URLs públicas não requerem autenticação
   - Este é o uso pretendido do recurso

---

## COMPARAÇÃO COM OUTROS BUCKETS

### Buckets Públicos

| Bucket | Public | Policies |
|--------|--------|----------|
| `banners` | ✅ | Public read, Authenticated upload/update/delete |
| `home-assets` | ✅ | Public read, Authenticated upload/update/delete |
| `logo-variacoes` | ✅ | Public read |
| `product-images` | ✅ | Public read, Internal upload/update/delete |
| `historia` | ✅ | Public read |

**Padrão:**
- Todos os buckets são públicos
- Todos têm leitura pública
- `product-images` é o mais restrito (usa `has_internal_role()`)

**Conclusão:**
- A configuração do `product-images` está alinhada com o padrão do projeto
- Na verdade, é **mais segura** que outros buckets (usa `has_internal_role()`)

---

## RECOMENDAÇÕES

### ✅ NÃO Remover Policies Atuais

**NÃO remover:**
- ❌ Policy de leitura pública (`Public read product images`)
- ❌ Bucket público (`public: true`)
- ❌ Policies de upload/update/delete internas

**Por que:**
1. Quebraria o carregamento de imagens na página pública
2. URLs públicas parariam de funcionar
3. O site ficaria inutilizável

### ✅ Melhorias Opcionais (Se Desejado)

Se quiser melhorar a segurança (opcional):

#### 1. **Adicionar Assinatura de URL (URL Signing)**
```sql
-- Criar policy que requer token temporário para leitura
CREATE POLICY "Signed read product images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'::text AND
  -- Verificar token temporário
  -- (implementação complexa)
);
```

**Vantagens:**
- URLs expiram após X tempo
- Mais difícil de compartilhar URLs permanentes

**Desvantagens:**
- Implementação complexa
- Necessita mudanças no frontend
- Pode afetar performance
- Overkill para este caso de uso

#### 2. **Requerer Autenticação para Leitura**
```sql
-- Mudar role de public para authenticated
CREATE POLICY "Authenticated read product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images'::text);
```

**Vantagens:**
- Apenas usuários logados podem ver imagens
- Mais controle

**Desvantagens:**
- ❌ Quebraria o site público
- Necessita login para ver catálogo
- Não é o objetivo do projeto

#### 3. **Adicionar Camada de CDN com Proteção**
- Configurar Cloudflare Workers para validar tokens
- Adicionar validação de referer
- Implementar rate limiting

**Vantagens:**
- Proteção adicional sem mudar policies
- Controlável via CDN

**Desvantagens:**
- Complexidade adicional
- Custos de CDN
- Overkill para este caso de uso

### ✅ Melhorias Recomendadas (Baixo Impacto)

1. **Monitorar Acesso (Opcional):**
   - Usar logs do Supabase para monitorar acessos
   - Identificar padrões suspeitos
   - Alertar para acessos anormais

2. **Limpar Arquivos Antigos (Opcional):**
   - Implementar job para deletar imagens não usadas
   - Reduzir superfície de ataque
   - Manter apenas imagens ativas

3. **Validar Paths no Frontend (Já Implementado):**
   - ✅ `checkImage()` valida se imagem existe
   - ✅ URLs quebradas são ignoradas
   - ✅ Não há necessidade de mudanças

---

## CONCLUSÃO

### ✅ Configuração Atual É Correta e Segura

A configuração atual do bucket `product-images` é:
- ✅ **Funcional:** Site público funciona corretamente
- ✅ **Segura:** Escrita restrita, sem listagem pública
- ✅ **Alinhada:** Segue o padrão do projeto
- ✅ **Equilibrada:** Risco aceitável para o caso de uso

### ✅ Não Há Exposição Desnecessária

As únicas permissões públicas são:
1. **SELECT** (leitura de arquivos por URL) — **Necessária** para o site funcionar
2. **Bucket público** — **Necessário** para URLs funcionarem

Não há:
- ❌ Listagem pública
- ❌ Escrita pública
- ❌ Acesso a outros buckets

### ✅ Recomendação: Manter Configuração Atual

**Não há necessidade de mudar nada.**

A configuração atual é:
- Funcional para o caso de uso
- Segura o suficiente para um catálogo público
- Alinhada com o padrão do projeto
- Equilibrada entre segurança e usabilidade

Se no futuro houver necessidade de mais segurança, considere:
- Adicionar camada de CDN com proteção
- Implementar monitoramento de acessos
- Limpar arquivos não usados

Por enquanto, **a configuração atual está ótima!**
