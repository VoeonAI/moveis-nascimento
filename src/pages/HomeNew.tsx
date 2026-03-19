import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { Product } from '@/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { Package, Search, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import HomeHeader from '@/components/home/HomeHeader';
import HeroBanner from '@/components/home/HeroBanner';
import CategorySection from '@/components/home/CategorySection';
import HomeAmbiences from '@/components/home/HomeAmbiences';
import PromotionalBanner from '@/components/home/PromotionalBanner';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import WeeklyHighlights from '@/components/home/WeeklyHighlights';
import HowToBuySection from '@/components/home/HowToBuySection';
import ProductGrid from '@/components/home/ProductGrid';
import { homeHeroService } from '@/services/homeHeroService';

const HomeNew = () => {
  const [hero, setHero] = useState<null>(null);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const data = await homeHeroService.getHomeHero();
        setHero(data);
      } catch (err) {
        console.error('[HomeNew] Erro ao carregar hero:', err);
        setHero(null);
      }
    };

    loadHero();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />

      {/* ================================================== */}
      {/* BLOCOS MANUAIS (personalizáveis via admin) */}
      {/* ================================================== */}
      
      {/* 1. Hero principal */}
      <HeroBanner
        title={hero?.title}
        highlightWord={hero?.highlight_word}
        imageUrl={hero?.image_url}
      />

      {/* 2. Banner Promocional (NOVO) */}
      <PromotionalBanner />

      {/* 3. Categorias principais */}
      <CategorySection />

      {/* 4. Ambientes que inspiram */}
      <HomeAmbiences />

      {/* 5. Banner institucional/promocional */}
      {/* Removido o PromotionalBanner antigo, agora é o bloco 2 */}

      {/* ================================================== */}
      {/* BLOCOS AUTOMÁTICOS (preenchidos por regra) */}
      {/* ================================================== */}

      {/* 6. Produtos em destaque (featured = true) */}
      <FeaturedProducts />

      {/* 7. Destaques da semana (on_promotion = true) */}
      <WeeklyHighlights />

      {/* ================================================== */}
      {/* BLOCOS MANUAIS / ESTATÍSTICOS */}
      {/* ================================================== */}

      {/* 8. Como comprar */}
      <HowToBuySection />

      {/* 9. Nossos produtos (todos os produtos) */}
      <ProductGrid />

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Móveis Nascimento</h3>
              <p className="text-gray-400">
                Transformando casas em lares desde 2004
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/catalog" className="hover:text-white">Catálogo</Link></li>
                <li><Link to="#" className="hover:text-white">Sobre Nós</Link></li>
                <li><Link to="#" className="hover:text-white">Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Categorias</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/catalog?category=sala" className="hover:text-white">Sala</Link></li>
                <li><Link to="/catalog?category=quarto" className="hover:text-white">Quarto</Link></li>
                <li><Link to="/catalog?category=cozinha" className="hover:text-white">Cozinha</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>(11) 99999-9999</li>
                <li>contato@moveisnascimento.com.br</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>© 2024 Móveis Nascimento. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeNew;