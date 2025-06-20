

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeroProps {
  onNavigate?: (page: string, searchQuery?: string) => void;
  onNavLinkClick?: (sectionId: string) => void;
}

const Hero = ({ onNavigate, onNavLinkClick }: HeroProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleMenuClick = () => {
    if (onNavigate) {
      onNavigate('menu', searchQuery);
    }
  };

  const handleViewAllMenuClick = () => {
    console.log("View all menu clicked - navigating to menu page");
    if (onNavigate) {
      onNavigate('menu');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onNavigate && searchQuery.trim()) {
      onNavigate('menu', searchQuery);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    }
  };

  const handleAboutClick = () => {
    if (onNavLinkClick) {
      onNavLinkClick('about');
    } else {
      // Fallback: scroll to about section
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <section className="relative bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white py-16 overflow-hidden">
      {/* Soft overlay for better readability */}
      <div className="absolute inset-0 bg-white/3 backdrop-blur-sm"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="font-playfair text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl tracking-wide
                       bg-gradient-to-r from-yellow-200 via-orange-100 to-red-100 bg-clip-text text-transparent
                       transform hover:scale-105 transition-transform duration-300">
          Warung IbuMus
        </h1>
        <p className="font-poppins text-xl md:text-2xl mb-2 opacity-95 drop-shadow-lg font-bold
                     text-yellow-100 tracking-wide">
          Makanan Rumahan Terenak di Kota
        </p>
        <p className="font-dancing text-lg md:text-xl mb-8 opacity-90 drop-shadow-md font-bold
                     text-orange-100 tracking-widest">
          Autentik • Lezat • Terpercaya
        </p>
        
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari makanan favorit..."
              className="pl-10 pr-10 py-3 text-gray-900 bg-white/90 backdrop-blur-sm border-white/20 shadow-lg font-poppins"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-orange-600 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg border-white/20 font-poppins font-semibold"
            onClick={handleMenuClick}
          >
            Lihat Menu
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-white border-2 border-white/90 bg-white/25 hover:bg-white/35 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg font-poppins font-semibold"
            onClick={handleAboutClick}
          >
            Tentang Kami
          </Button>
        </div>

        {/* View All Menu Button */}
        <div className="mt-6">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 border border-white/30 px-6 py-2 rounded-lg transition-all duration-200 font-poppins font-medium"
            onClick={handleViewAllMenuClick}
          >
            Lihat semua menu →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
