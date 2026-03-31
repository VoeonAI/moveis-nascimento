import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HomeHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToProducts = () => {
    const productsSection = document.getElementById('products-section');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5511999999999', '_blank');
  };

  return (
    <header className="bg-black sticky top-0 z-50 border-b border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Aumentado em 60% (h-12 → h-20) */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Moveis-nascimento---logo-site.png"
              alt="Móveis Nascimento"
              className="h-20 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={scrollToProducts}
              className="text-white hover:text-green-400 font-medium transition-colors"
            >
              Produtos
            </button>
            <Link 
              to="/sobre"
              className="text-white hover:text-green-400 font-medium transition-colors"
            >
              Sobre Nós
            </Link>
            <Link 
              to="/montadores"
              className="text-white hover:text-green-400 font-medium transition-colors"
            >
              Montadores
            </Link>
            <Button 
              onClick={handleWhatsAppClick}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Fale com o Nas
            </Button>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-800 bg-black">
            <button 
              onClick={scrollToProducts}
              className="block w-full text-left text-white hover:text-green-400 font-medium py-2"
            >
              Produtos
            </button>
            <Link 
              to="/sobre"
              className="block w-full text-left text-white hover:text-green-400 font-medium py-2"
            >
              Sobre Nós
            </Link>
            <Link 
              to="/montadores"
              className="block w-full text-left text-white hover:text-green-400 font-medium py-2"
            >
              Montadores
            </Link>
            <Button 
              onClick={handleWhatsAppClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Fale com o Nas
            </Button>
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;