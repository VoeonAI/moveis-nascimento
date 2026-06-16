import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { Product } from '@/services/productsService';
import ProductCard from '@/components/products/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Loader2, X, MessageCircle, Package } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/core/supabaseClient';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import TestTracking from '@/components/debug/TestTracking';
import HomeHeader from '@/components/home/HomeHeader';

const Index = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]); // Todas as categorias, incluindo subcategorias
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [searchParams] = useState(new URLSearchParams());
  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || '';
  
  useEffect(() => {
    setSearchQuery(searchFromUrl);
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchFromUrl, categoryFromUrl]);

  useEffect(() => {
    const loadWhatsappNumber = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'store_whatsapp_e164')
        .single();

      if (error) {
        console.error('Erro ao carregar WhatsApp da loja:', error);
        return;
      }

      setWhatsappNumber(data?.value || '');
    };

    loadWhatsappNumber();
  }, []);

  // Check if user can see internal price
  const canSeeInternalPrice = profile?.role && [Role.MASTER, Role.GESTOR, Role.ESTOQUE].includes(profile.role);

  // Helper para determinar a fonte do clique baseada no contexto
  const getClickSource = () => {
    if (searchQuery.trim()) return 'search';
    return 'catalog';
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Helper para obter todos os IDs de uma categoria pai e TODAS as suas descendentes (recursivo)
  // Protegido contra loops/ciclos e com garantia de IDs únicos
  const getDescendantCategoryIds = (parentId: string, visited = new Set<string>()): string[] => {
    // Guard: evitar ciclos infinitos
    if (visited.has(parentId)) {
      return [];
    }
    visited.add(parentId);

    const children = allCategories.filter((cat: any) => cat.parent_id === parentId);
    const ids = children.map((cat: any) => cat.id);
    
    // Recursivamente obter descendentes de cada filho (com proteção contra ciclos)
    children.forEach((child: any) => {
      ids.push(...getDescendantCategoryIds(child.id, visited));
    });
    
    // Garantir IDs únicos (proteção contra duplicidade)
    return Array.from(new Set(ids));
  };

  // Helper para obter slugs de uma categoria pai e TODAS as suas subcategorias (recursivo)
  // Protegido com fallback seguro e garantia de slugs únicos
  const getCategorySlugs = (parentSlug: string): string[] => {
    // Guard: evitar processamento desnecessário
    if (!allCategories || allCategories.length === 0) {
      return [parentSlug];
    }
    
    // Guard: fallback seguro quando slug não existe
    const parentCategory = allCategories.find((cat: any) => cat.slug === parentSlug);
    if (!parentCategory) {
      return [parentSlug];
    }
    
    // Obter todos os IDs das categorias descendentes (recursivo, com proteção)
    const descendantIds = getDescendantCategoryIds(parentCategory.id);
    
    // Filtrar categorias ativas cujo ID seja o pai ou esteja nos descendentes
    const slugs = allCategories
      .filter((cat: any) => 
        // Garantir que a categoria tem slug
        cat.slug && 
        // Filtrar apenas categorias ativas (como o catálogo público usa listActiveCategories)
        // e que sejam o pai ou descendentes
        (cat.id === parentCategory.id || descendantIds.includes(cat.id))
      )
      .map((cat: any) => cat.slug);
    
    // Garantir slugs únicos
    const uniqueSlugs = Array.from(new Set(slugs));
    
    // Fallback: se nenhum slug foi encontrado, retornar o original
    return uniqueSlugs.length > 0 ? uniqueSlugs : [parentSlug];
  };

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) {
      console.error('WhatsApp da loja não configurado.');
      return;
    }

    const normalized = whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(
      'Oi, eu estou vendo o catálogo de produtos no site e quero ajuda pra encontrar um produto.'
    );

    window.open(`https://wa.me/${normalized}?text=${message}`, '_blank');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsService.listPublicProducts(),
        categoriesService.listActiveCategories(),
      ]);

      // Carregar todas as categorias (não apenas as raiz)
      setAllCategories(categoriesData);

      // Helper: obter todos os IDs de uma categoria e suas descendentes (recursivo)
      const getSubtreeIds = (rootId: string, visited = new Set<string>()): string[] => {
        if (visited.has(rootId)) return [];
        visited.add(rootId);
        const ids = [rootId];
        const children = categoriesData.filter((c: any) => c.parent_id === rootId);
        children.forEach((child: any) => {
          ids.push(...getSubtreeIds(child.id, visited));
        });
        return ids;
      };

      // Verificar se uma categoria raiz tem produtos diretos ou em descendentes
      const rootHasProducts = (rootId: string) => {
        const subtreeIds = getSubtreeIds(rootId);
        return productsData.some((p: any) =>
          p.categories && p.categories.some((cat: any) => subtreeIds.includes(cat.id))
        );
      };

      // IDs de categorias que têm produtos diretos
      const categoryIdsWithDirectProducts = new Set<string>();
      productsData.forEach((p: any) => {
        if (p.categories) {
          p.categories.forEach((cat: any) => {
            if (cat.id) categoryIdsWithDirectProducts.add(cat.id);
          });
        }
      });

      // Categorias visíveis: raízes com produtos + subcategorias com produtos diretos
      const rootCategories = categoriesData
        .filter((cat: any) => !cat.parent_id)
        .filter((cat: any) => rootHasProducts(cat.id));

      const subCategoriesWithProducts = categoriesData
        .filter((cat: any) => cat.parent_id !== null)
        .filter((cat: any) => categoryIdsWithDirectProducts.has(cat.id));

      // Ordenar: raízes primeiro (alfabeticamente), depois subcategorias (alfabeticamente)
      const visibleCategories = [
        ...rootCategories.sort((a: any, b: any) => a.name.localeCompare(b.name)),
        ...subCategoriesWithProducts.sort((a: any, b: any) => a.name.localeCompare(b.name)),
      ];

      setCategories(visibleCategories);
      setAllProducts(productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('[Index] Load error:', error);
      setProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters (category + search + sort)
  useEffect(() => {
    let filtered = [...allProducts];

    // Category filter - filtrar por categoria pai incluindo TODAS as subcategorias (recursivo)
    if (selectedCategory !== 'all') {
      // Verificar se a categoria selecionada é raiz ou subcategoria
      const selectedCat = allCategories.find((cat: any) => cat.slug === selectedCategory);
      const isRootCategory = selectedCat && !selectedCat.parent_id;

      // Se for raiz, incluir todas as subcategorias descendentes; se for subcategoria, usar slug exato
      const categorySlugs = isRootCategory
        ? getCategorySlugs(selectedCategory)
        : [selectedCategory];

      // Guard: processar apenas se categorySlugs for válido
      if (categorySlugs && categorySlugs.length > 0) {
        filtered = filtered.filter(p => {
          // Guard: produtos sem categories são ignorados (não aparecem no filtro)
          if (!p.categories || p.categories.length === 0) {
            return false;
          }

          // Guard: filtrar apenas produtos que têm categories com slug válido
          return p.categories.some(cat =>
            cat.slug && categorySlugs.includes(cat.slug)
          );
        });
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query)) ||
        // Guard: categorias podem ser undefined, adicionar verificação segura
        (p.categories && p.categories.some(cat => cat.name && cat.name.toLowerCase().includes(query)))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setProducts(filtered);
  }, [allProducts, selectedCategory, searchQuery, sortBy, allCategories]);

  // Handle category chip click
  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
  };

  if (loading) return <div className="p-8 text-center">Carregando catálogo...</div>;

  const canManageCatalog = profile?.role === 'master' || profile?.role === 'gestor';

  if (products.length === 0 && selectedCategory === 'all' && !searchQuery) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeHeader />
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Nenhum produto cadastrado ainda</h1>
            <p className="text-gray-600 mb-6">
              O catálogo está vazio no momento.
            </p>
            {canManageCatalog && (
              <Link 
                to="/app/catalog"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Ir para Catálogo
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Componente de teste para debug - remover em produção */}
      <TestTracking />
      
      {/* Header with Logo and Menu */}
      <HomeHeader />

      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Explore nosso catálogo
              </h1>
              <p className="text-xl text-gray-600">
                Encontre o móvel perfeito para transformar sua casa
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Mascote%203D%20-%20Moveis%20Nascimento.png"
                alt="Mascote Nas"
                className="h-32 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-green-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-green-600" size={24} />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Posso te ajudar a encontrar o móvel ideal
                </p>
              </div>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleWhatsAppClick}
            >
              Falar com Nas
            </Button>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Dropdown */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="name-desc">Nome Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto encontrado nesta categoria.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Index;