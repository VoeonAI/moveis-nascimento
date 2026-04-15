# GUIA DE TESTE — VALIDAÇÃO DO FLUXO NOVO

## RÁPIDO E PRÁTICO — 10 MINUTOS

Siga estes passos para validar que o fluxo novo está funcionando corretamente.

---

## PASSO 1: CRIAR PRODUTO NOVO (3 min)

1. **Acesse o painel admin:**
   ```
   /app/catalog
   ```

2. **Clique em "Novo Produto"**

3. **Preencha o formulário:**
   - Nome: **"Produto Teste Validação"**
   - Descrição: **"Teste do fluxo novo de imagens"**
   - Categoria: Selecione qualquer uma
   - Preço: **"1000.00"**
   - Ativo: ✅

4. **Upload de imagens:**
   - Clique em "Adicionar Imagens"
   - Selecione **2-3 imagens** (JPG/PNG reais, não placeholders)
   - Imagens devem aparecer na lista

5. **Clique em "Salvar"**

6. **Verifique:**
   - ✅ Produto aparece na lista
   - ✅ Imagem de capa aparece
   - ✅ Sem erros no console

---

## PASSO 2: ADICIONAR VARIAÇÕES (2 min)

1. **Clique em "Editar" no produto criado**

2. **Vá para a seção "Variações"**

3. **Adicione 2 variações:**
   - Clique em "Adicionar Variação"
   - Nome: **"Azul"** → Confirmar
   - Clique em "Adicionar Variação"
   - Nome: **"Vermelho"** → Confirmar

4. **Verifique:**
   - ✅ Ambas as variações aparecem
   - ✅ "Azul" está marcada como padrão

5. **Clique em "Salvar"**

---

## PASSO 3: VINCULAR IMAGENS ÀS VARIAÇÕES (3 min)

1. **Clique em "Editar" novamente no produto**

2. **Para a primeira imagem:**
   - Clique no botão "Variantes" (ícone de paleta 🎨)
   - No diálogo:
     - Marque ✅ **"Azul"**
     - Clique em **"Definir como Primária"** (★)
   - Feche o diálogo

3. **Para a segunda imagem:**
   - Clique no botão "Variantes"
   - No diálogo:
     - Marque ✅ **"Azul"**
     - Marque ✅ **"Vermelho"**
     - NÃO defina como primária
   - Feche o diálogo

4. **Para a terceira imagem (se tiver):**
   - Clique no botão "Variantes"
   - No diálogo:
     - Marque ✅ **"Vermelho"**
     - Clique em **"Definir como Primária"** (★)
   - Feche o diálogo

5. **Verifique:**
   - ✅ Contador de variantes em cada imagem (ex: "1 imagem(ns) vinculada(s)")
   - ✅ Estrela (★) indica imagem principal

6. **Clique em "Salvar"**

---

## PASSO 4: TESTAR NA PÁGINA PÚBLICA (2 min)

1. **Copie o ID do produto**
   - Na lista de produtos, o ID está no caminho URL ao clicar em "Editar"
   - Ou copie da URL após salvar

2. **Acesse a página pública:**
   ```
   /product/<ID-DO-PRODUTO>
   ```

3. **Verifique a imagem principal:**
   - ✅ Imagem marcada como primária (★) aparece
   - ✅ Console mostra: `[ProductDetail] → Using is_primary image: ...`

4. **Verifique as thumbnails:**
   - ✅ Todas as imagens da variação "Azul" aparecem
   - ✅ Console mostra: `[ProductDetail] → Valid images: X`
   - ✅ Se houver imagens quebradas, console mostra: `[ProductDetail] ❌ Removed: ...`

5. **Troque de cor:**
   - Clique em **"Vermelho"**
   - ✅ Imagens mudam para as vinculadas a "Vermelho"
   - ✅ Imagem marcada como primária (★) aparece
   - ✅ Console mostra nova validação

---

## PASSO 5: ALTERAR IMAGEM PRINCIPAL (opcional, 1 min)

1. **Volte ao catálogo admin**

2. **Clique em "Editar" no produto**

3. **Mude a imagem principal da variação "Vermelho":**
   - Para uma imagem não primária, clique em "Variantes"
   - Marque **"Vermelho"**
   - Clique em **"Definir como Primária"** (★)
   - Verifique que a estrela mudou de lugar

4. **Clique em "Salvar"**

5. **Recarregue a página pública**

6. **Verifique:**
   - ✅ Nova imagem agora é a principal
   - ✅ Console mostra novo caminho: `[ProductDetail] → Using is_primary image: ...`

---

## RESULTADO ESPERADO

### ✅ TUDO CERTO SE:
- Produto foi criado com imagens
- Variações foram adicionadas
- Imagens foram vinculadas às variações
- Campo `is_primary` funciona (estrela aparece)
- Página pública mostra a imagem correta
- Troca de cor funciona
- Console não mostra erros graves

### ⚠️ SE HOUVER PROBLEMAS:
1. **Imagens não aparecem:**
   - Verifique console para erros de upload
   - Confirme que o bucket do Supabase existe
   - Verifique permissões do storage

2. **Variações não funcionam:**
   - Verifique se `product_variants` está sendo salvo
   - Confirme que `product_image_variants` foi criado
   - Verifique logs no console

3. **Imagem principal errada:**
   - Verifique se `is_primary` foi definido
   - Verifique logs de priorização no console
   - Confirme que há apenas uma primária por variação

---

## LOGS IMPORTANTES

### Console do Browser (F12)

Ao abrir a página pública, você deve ver:

```
[ProductDetail] 🔍 currentImages calculation:
[ProductDetail]   Product: Produto Teste Validação
[ProductDetail]   Has variants: true
[ProductDetail]   Selected variant: uuid-da-variacao

[ProductDetail]   → Found 2 images for variant from product.image_variants

[ProductDetail] 🔍 resolvedCurrentImages calculation:
[ProductDetail]   → Total raw paths: 2
[ProductDetail]   → Valid resolved URLs: 2

[ProductDetail] 🔍 Validating gallery images...
[ProductDetail]   → Total to validate: 2
[ProductDetail]   → Valid images: 2
[ProductDetail]   → Broken images removed: 0

[ProductDetail] 🔍 mainImageUrl calculation:
[ProductDetail]   → Using is_primary image: https://...
[ProductDetail]   → URL: https://...

[ProductDetail] 🖼️ RENDER STATE:
[ProductDetail]   mainImageUrl: https://...
[ProductDetail]   galleryValidImages: [...]
```

---

## CONCLUSÃO

Se tudo funcionou corretamente, **o fluxo novo está aprovado!** ✅

Daqui para frente:
- ✅ Criação de produtos com imagens funciona
- ✅ Edição de produtos funciona
- ✅ Adição de variações funciona
- ✅ Vinculação imagem-variação funciona
- ✅ Campo `is_primary` funciona
- ✅ Página pública reflete todas as mudanças

**Imagens antigas inválidas permanecem como legado e não afetam o fluxo novo.**

---

## LIMPEZA (opcional)

Se quiser remover o produto de teste:

1. Vá ao catálogo admin
2. Clique em "Editar" no produto
3. Clique em "Excluir"
4. Confirme
