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
import Footer from '@/components/layout/Footer';
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

      {/* 2. Categorias principais */}
      <CategorySection />

      {/* 3. Ambientes que inspiram */}
      <HomeAmbiences />

      {/* 4. Banner Promocional */}
      <PromotionalBanner />

      {/* ================================================== */}
      {/* BLOCOS AUTOMÁTICOS (preenchidos por regra) */}
      {/* ================================================== */}

      {/* 5. Produtos em destaque (featured = true) */}
      <FeaturedProducts />

      {/* 6. Destaques da semana (on_promotion = true) */}
      <WeeklyHighlights />

      {/* ================================================== */}
      {/* BLOCOS MANUAIS / ESTATÍSTICOS */}
      {/* ================================================== */}

      {/* 7. Como comprar */}
      <HowToBuySection />

      {/* 8. Nossos produtos (todos os produtos) */}
      <ProductGrid />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomeNew;