import MenuCard from "./MenuCard";
import { User } from "@supabase/supabase-js";
import { TrendingUp, Users, Clock, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_popular?: boolean;
  is_available?: boolean;
  category_id?: string;
  categories?: {
    name: string;
  };
}

interface PopularItemsProps {
  items: MenuItem[];
  user?: User;
  onShowAuth: () => void;
  onNavigateToMenu?: () => void;
}

const PopularItems = ({ items, user, onShowAuth, onNavigateToMenu }: PopularItemsProps) => {
  console.log("PopularItems component received:", items?.length, "items");
  console.log("Popular items data:", items);

  const handleViewAllMenu = () => {
    console.log("View all menu clicked");
    if (onNavigateToMenu) {
      onNavigateToMenu();
    } else {
      // Fallback: scroll to top and let parent handle navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) {
    console.log("No popular items to display");
    return (
      <section className="py-12 sm:py-16 lg:py-20 canvas-gradient-peach">
        <div className="container-modern">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              <span className="text-gradient">Menu Favorit</span>
            </h2>
            <p className="text-gray-600">Belum ada menu favorit yang tersedia saat ini.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 canvas-gradient-peach relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-red-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/25 rounded-full blur-xl animate-pulse-soft"></div>
        
        {/* Sparkle decorations */}
        <div className="absolute top-20 right-1/4 opacity-30">
          <Sparkles className="w-6 sm:w-8 h-6 sm:h-8 text-orange-400 animate-pulse-soft" />
        </div>
        <div className="absolute bottom-1/4 left-1/6 opacity-25">
          <Sparkles className="w-4 sm:w-6 h-4 sm:h-6 text-red-400 animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="container-modern relative z-10">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in px-4">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 
                         bg-white/95 backdrop-blur-sm text-orange-700 
                         rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 
                         shadow-soft hover-lift border border-orange-200">
            <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
            Menu Terpopuler
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
            <span className="text-gradient">Favorit</span> Pelanggan
          </h2>
          
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Nikmati hidangan terfavorit yang telah dipercaya ribuan pelanggan kami
          </p>

          {/* Enhanced Stats - Mobile Responsive with Fixed Colors */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mt-6 sm:mt-8">
            <div className="flex items-center gap-3 
                           bg-white/95 backdrop-blur-sm 
                           px-3 sm:px-4 py-2 rounded-full 
                           shadow-soft hover-lift
                           border border-orange-200/50">
              <Users className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">1000+ pelanggan puas</span>
            </div>
            
            {/* Separator - hidden on mobile, visible on larger screens */}
            <div className="hidden sm:block w-2 h-2 bg-orange-300 rounded-full animate-pulse-soft"></div>
            
            <div className="flex items-center gap-3 
                           bg-white/95 backdrop-blur-sm 
                           px-3 sm:px-4 py-2 rounded-full 
                           shadow-soft hover-lift
                           border border-orange-200/50">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Penyajian cepat</span>
            </div>
            
            <div className="hidden sm:block w-2 h-2 bg-orange-300 rounded-full animate-pulse-soft"></div>
            
            <div className="flex items-center gap-3 
                           bg-white/95 backdrop-blur-sm 
                           px-3 sm:px-4 py-2 rounded-full 
                           shadow-soft hover-lift
                           border border-orange-200/50">
              <Star className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-500 fill-current" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Rating 4.8/5</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
          {items.map((item, index) => {
            console.log(`Rendering item ${index + 1}:`, item.name, "- Popular:", item.is_popular);
            return (
              <div 
                key={item.id} 
                className="animate-slide-up hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <MenuCard item={item} user={user} onShowAuth={onShowAuth} />
              </div>
            );
          })}
        </div>

        {/* Enhanced Call to action - Mobile Responsive with Fixed Colors */}
        <div className="text-center mt-12 sm:mt-16 px-4">
          <Button
            onClick={handleViewAllMenu}
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 
                       bg-gradient-to-r from-orange-500 to-red-500 
                       hover:from-orange-600 hover:to-red-600 
                       text-white font-semibold 
                       border-0 rounded-full 
                       shadow-medium hover:shadow-strong 
                       transition-all duration-300 
                       hover:-translate-y-1 hover:scale-105
                       focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          >
            <span className="text-sm sm:text-base font-medium">Lihat semua menu</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularItems;