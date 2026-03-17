import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { Product } from '@/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { Package, Search, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import HomeHeader from '@/components/home/HomeHeader';
import { homeService, HomeConfig } from '@/services/homeService';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const { profile } = useAuth();

  // Home config state
  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Check if user can see internal price
  const canSeeInternalPrice = [Role.MASTER, Role.GESTOR, Role.ESTOQUE].includes(profile?.role ?? "");

  // Load initial data
  useEffect(() => {
    Promise.all([
      productsService.listPublicProducts(),
      categoriesService.listActiveCategories(),
      homeService.getHomeConfig(),
    ])
      .then(([productsData, categoriesData, configData]) => {
        // Filter to show only root categories (parent_id is null)
        const rootCategories = categoriesData.filter((cat: any) => !cat.parent_id);
        setCategories(rootCategories);
        setAllProducts(productsData);
        setProducts(productsData);
        setHomeConfig(configData);
      })
      .catch((error) => {
        console.error('[Index] Load error:', error);
        setProducts([]);
        setAllProducts([]);
        setHomeConfig(null);
      })
      .finally(() => {
        setLoading(false);
        setConfigLoading(false);
      });
  }, []);

  // Apply filters (category + search + sort)
  useEffect(() => {
    let filtered = [...allProducts];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.categories?.some(cat => cat.slug === selectedCategory)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.categories && p.categories.some(cat => cat.name.toLowerCase().includes(query)))
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
          config;
      }
    });

    setProducts(filtered);
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  // Handle category chip click
  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
  };

  // Get hero config with fallbacks
  const heroTitle = homeConfig?.hero_title || 'Explore nosso catálogo';
  const heroHighlightWord = homeConfig?.hero_highlight_word || 'encontre o móvel perfeito';
  const heroImageUrl = homeConfig?.hero_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80';

  // Get promo config with fallbacks
  const promoEnabled = homeConfig?.promo_enabled || false;
  const promoText = homeConfig?.promo_text || '';
  const promoImageUrl = homeConfig?.promo_image_url || '';

  // Get ambiences with fallback to default categories
  const ambiences = homeConfig?.ambiences || [];

  if (configLoading) return <div className="p-8 text-center">Carregando...</div>;

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
      {/* Header with Logo and Menu */}
      <HomeHeader />

      {/* Header Section - Using config from Supabase */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {heroTitle}{' '}
                <span className="text-green-600">{heroHighlightWord}</span>
              </h1>
              <p className="text-xl text-gray-600">
                Atendimento personalizado com o Nas e suporte do nosso time de consultores.
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
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            >
              Falar com Nas
            </Button>
          </div>
        </div>
      </div>

      {/* Ambiences Section - Using config from Supabase */}
      {ambiences.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {ambiences.map((ambience) => (
                <Link
                  key={ambience.id}
                  to={`/catalog?category=${ambience.category_slug}`}
                  className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    <img
                      src={ambience.image_url}
                      alt={ambience.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white text-center">
                      {ambience.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Chips - Fallback if no ambiences configured */}
      {ambiences.length === 0 && (
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
      )}

      {/* Promo Banner - Using config from Supabase */}
      {promoEnabled && (promoText || promoImageUrl) && (
        <div className="bg-gradient-to-r from-orange-50 to-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between gap-6">
              {promoImageUrl && (
                <img
                  src={promoImageUrl}
                  alt="Banner promocional"
                  className="h-24 md:h-32 object-cover rounded-xl"
                />
              )}
              <div className="flex-1">
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {promoText || 'Oferta especial!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Index;