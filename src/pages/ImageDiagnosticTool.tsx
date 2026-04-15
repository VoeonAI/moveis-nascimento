import React, { useState, useEffect } from 'react';
import { supabase } from '@/core/supabaseClient';
import { productImagesService } from '@/services/productImagesService';

interface Product {
  id: string;
  name: string;
  images: string[];
  variants?: Array<{
    id: string;
    name: string;
    primary_image?: string;
  }>;
  image_variants?: Array<{
    variant_id: string;
    image_url: string;
  }>;
}

interface DiagnosticResult {
  productId: string;
  productName: string;
  imagePath: string;
  resolvedUrl: string;
  isValid: boolean;
  status: 'pending' | 'loading' | 'success' | 'error';
  httpCode?: number;
}

const ImageDiagnosticTool = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          images,
          variants (
            id,
            name,
            primary_image
          ),
          image_variants (
            variant_id,
            image_url
          )
        `)
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('[ImageDiagnosticTool] Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const collectImagePaths = (product: Product): string[] => {
    const paths: string[] = [];

    // Imagens do produto
    if (product.images && Array.isArray(product.images)) {
      paths.push(...product.images);
    }

    // Imagens das variantes
    if (product.image_variants) {
      product.image_variants.forEach(iv => {
        if (iv.image_url) {
          paths.push(iv.image_url);
        }
      });
    }

    // Imagem principal de cada variante
    if (product.variants) {
      product.variants.forEach(v => {
        if (v.primary_image) {
          paths.push(v.primary_image);
        }
      });
    }

    // Remover duplicatas e valores vazios
    return [...new Set(paths.filter(p => p && p.trim()))];
  };

  const testImage = async (productId: string, productName: string, imagePath: string): Promise<DiagnosticResult> => {
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`[ImageDiagnosticTool] Testing image for product: ${productName}`);
    console.log(`[ImageDiagnosticTool] Image path: ${imagePath}`);
    console.log(`═══════════════════════════════════════════════════`);

    // Usar o helper para resolver a URL
    const resolvedUrl = productImagesService.resolveProductImageUrl(imagePath);

    if (!resolvedUrl) {
      console.warn(`[ImageDiagnosticTool] ⚠️ URL not resolved for path: ${imagePath}`);
      return {
        productId,
        productName,
        imagePath,
        resolvedUrl: 'NOT RESOLVED',
        isValid: false,
        status: 'error',
      };
    }

    // Testar a URL com fetch para obter código HTTP
    try {
      const response = await fetch(resolvedUrl, { method: 'HEAD', mode: 'no-cors' });

      // Como usamos no-cors, não conseguimos ler o status
      // Mas sabemos que não houve erro de rede
      console.log(`[ImageDiagnosticTool] ✅ Network request succeeded for: ${resolvedUrl}`);

      return {
        productId,
        productName,
        imagePath,
        resolvedUrl,
        isValid: true,
        status: 'success',
      };
    } catch (error) {
      console.error(`[ImageDiagnosticTool] ❌ Network request failed for: ${resolvedUrl}`);
      console.error(`[ImageDiagnosticTool] Error:`, error);

      return {
        productId,
        productName,
        imagePath,
        resolvedUrl,
        isValid: false,
        status: 'error',
      };
    }
  };

  const testAllImages = async () => {
    setTestingAll(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    for (const product of products) {
      const paths = collectImagePaths(product);

      for (const path of paths) {
        const result = await testImage(product.id, product.name, path);
        results.push(result);
      }
    }

    setDiagnostics(results);
    setTestingAll(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada!');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Ferramenta de Diagnóstico de Imagens</h1>
          <p className="text-gray-600 mb-4">
            Teste URLs de imagens de produtos para identificar problemas de carregamento.
          </p>

          <div className="flex gap-4">
            <button
              onClick={testAllImages}
              disabled={testingAll || products.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingAll ? 'Testando...' : 'Testar Todas as Imagens'}
            </button>

            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Recarregar Produtos
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Carregando produtos...</div>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-yellow-800">
              Nenhum produto encontrado. Verifique se você está conectado ao banco de dados.
            </div>
          </div>
        )}

        {diagnostics.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Resultados ({diagnostics.length} imagens)
              </h2>
            </div>

            <div className="divide-y">
              {diagnostics.map((diag, idx) => (
                <div key={idx} className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-gray-900 mb-2">
                        {diag.productName}
                      </div>
                      <div className="text-sm text-gray-600 break-all">
                        <strong>Path original:</strong> {diag.imagePath}
                      </div>
                      <div className="text-sm text-gray-600 break-all mt-1">
                        <strong>URL resolvida:</strong> {diag.resolvedUrl}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          diag.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {diag.status === 'success' ? '✅ OK' : '❌ ERRO'}
                        </span>

                        {diag.resolvedUrl && diag.resolvedUrl !== 'NOT RESOLVED' && (
                          <button
                            onClick={() => window.open(diag.resolvedUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Abrir em nova aba
                          </button>
                        )}

                        {diag.resolvedUrl && diag.resolvedUrl !== 'NOT RESOLVED' && (
                          <button
                            onClick={() => copyToClipboard(diag.resolvedUrl)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Copiar URL
                          </button>
                        )}
                      </div>

                      {diag.status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                          <p><strong>Problema detectado:</strong></p>
                          {diag.resolvedUrl === 'NOT RESOLVED' ? (
                            <p>O helper não conseguiu gerar uma URL pública para este path.</p>
                          ) : (
                            <p>Ocorreu um erro ao tentar carregar a imagem via rede.</p>
                          )}
                          <p className="mt-2">
                            <strong>Ação:</strong> Abra o console do navegador para ver logs detalhados de diagnóstico.
                          </p>
                        </div>
                      )}

                      {diag.status === 'success' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                          <p><strong>Sucesso!</strong></p>
                          <p>URL gerada e rede respondeu sem erros.</p>
                          <p className="mt-2">
                            <strong>Próximo passo:</strong> Se a imagem ainda não aparece no ProductDetail, o problema pode ser no componente React.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && diagnostics.length === 0 && !testingAll && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800">
              Carregados {products.length} produtos. Clique em "Testar Todas as Imagens" para iniciar o diagnóstico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDiagnosticTool;
