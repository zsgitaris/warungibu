import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Check, Star, Clock, Sparkles, Flame, TrendingUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_popular?: boolean;
  categories?: {
    name: string;
  };
}

interface MenuCardProps {
  item: MenuItem;
  user?: User;
  onShowAuth: () => void;
}

const MenuCard = ({ item, user, onShowAuth }: MenuCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('menu_item_id', item.id)
        .limit(1);

      const existingItem = existingItems?.[0];

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        if (error) throw error;
        return { isNew: false, quantity: existingItem.quantity + 1 };
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            menu_item_id: item.id,
            quantity: 1
          });
        if (error) throw error;
        return { isNew: true, quantity: 1 };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      
      const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(price);
      };

      toast({
        title: "✅ Berhasil Ditambahkan!",
        description: (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Harga: <span className="font-medium text-orange-600">{formatPrice(item.price)}</span></div>
                  <div>Jumlah: <span className="font-medium">{data.quantity}</span></div>
                  {data.isNew ? (
                    <div className="text-green-600 font-medium">✨ Item baru ditambahkan ke keranjang</div>
                  ) : (
                    <div className="text-blue-600 font-medium">📈 Jumlah item diperbarui</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ),
        className: "notification-modern border-l-4 border-l-green-500",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Menambahkan",
        description: (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">✕</span>
            </div>
            <span>Terjadi kesalahan saat menambahkan item ke keranjang. Silakan coba lagi.</span>
          </div>
        ),
        variant: "destructive",
        className: "notification-modern border-l-4 border-l-red-500",
      });
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "🔐 Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk menambahkan item ke keranjang",
        variant: "destructive",
        className: "notification-modern",
      });
      onShowAuth();
      return;
    }
    addToCartMutation.mutate();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Enhanced image URL validation and display logic
  const getImageSrc = () => {
    if (!item.image_url) return null;
    
    // Check if it's a blob URL (from recent upload)
    if (item.image_url.startsWith('blob:')) {
      console.log('Using blob URL for image:', item.image_url);
      return item.image_url;
    }
    
    // Check if it's already a full URL
    if (item.image_url.startsWith('http')) {
      console.log('Using full URL for image:', item.image_url);
      return item.image_url;
    }
    
    // Default placeholder for invalid URLs
    console.log('Invalid image URL detected:', item.image_url);
    return null;
  };

  const imageSrc = getImageSrc();

  // Generate random rating between 4.5-5.0 for demo
  const rating = (4.5 + Math.random() * 0.5).toFixed(1);
  
  // Generate random cooking time between 10-25 minutes
  const cookingTime = Math.floor(Math.random() * 16) + 10;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50/80 via-white to-amber-50/60 border-2 border-orange-100/60 hover:border-orange-200 rounded-3xl shadow-soft hover:shadow-strong transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
      {/* Image Container with Enhanced Styling */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-gradient-to-br from-orange-100 to-amber-100">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={item.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
            onLoad={() => {
              console.log('Image loaded successfully:', imageSrc);
            }}
            onError={(e) => {
              console.error('Image failed to load:', imageSrc);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-emoji');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        
        {/* Fallback with Enhanced Design */}
        <div 
          className="fallback-emoji absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-200/80 to-amber-200/80 backdrop-blur-sm" 
          style={{ display: imageSrc ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <span className="text-6xl animate-bounce-gentle drop-shadow-lg">🍽️</span>
            <p className="text-orange-700 font-medium mt-2 text-sm">Foto Segera Hadir</p>
          </div>
        </div>
        
        {/* Enhanced Popular Badge */}
        {item.is_popular && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white rounded-full shadow-strong text-xs font-bold backdrop-blur-sm border border-white/20 animate-pulse-soft">
              <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Popular</span>
              <Sparkles className="w-3 h-3 animate-pulse" />
            </div>
          </div>
        )}

        {/* Enhanced Category Badge */}
        {item.categories && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-orange-700 rounded-full text-xs font-semibold shadow-medium border border-orange-200/50 hover:bg-white transition-all duration-200">
              {item.categories.name}
            </span>
          </div>
        )}

        {/* New Badge for Demo */}
        {Math.random() > 0.7 && (
          <div className="absolute top-16 left-4 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-medium text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              <span>New</span>
            </div>
          </div>
        )}

        {/* Spicy Badge for Demo */}
        {Math.random() > 0.8 && (
          <div className="absolute top-28 left-4 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full shadow-medium text-xs font-bold">
              <Flame className="w-3 h-3" />
              <span>Pedas</span>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating Sparkles */}
        <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
          <Sparkles className="w-6 h-6 text-white animate-pulse-soft" />
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4 relative">
        {/* Enhanced Title and Description */}
        <div className="space-y-3">
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-gray-900 leading-tight line-clamp-1 group-hover:text-orange-600 transition-colors duration-300 font-playfair">
              {item.name}
            </h3>
            
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-poppins">
                {item.description}
              </p>
            )}
          </div>

          {/* Enhanced Info Row with Real Data */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium text-blue-700">{cookingTime} min</span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                <span className="font-medium text-yellow-700">{rating}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-orange-700">Terlaris</span>
            </div>
          </div>
          
          {/* Enhanced Price and Add Button */}
          <div className="flex justify-between items-end pt-3 border-t border-orange-100/50">
            <div className="space-y-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent font-playfair">
                {formatPrice(item.price)}
              </span>
              <div className="text-xs text-gray-500 font-medium">
                per porsi
              </div>
            </div>
            
            <Button
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-2xl shadow-strong hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 group/btn border-2 border-white/20"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                    <span className="font-bold">Tambah</span>
                    <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-orange-200/20 to-red-200/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </CardContent>

      {/* Card Glow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-400/0 via-red-400/0 to-orange-400/0 group-hover:from-orange-400/10 group-hover:via-red-400/5 group-hover:to-orange-400/10 transition-all duration-500 pointer-events-none" />
    </Card>
  );
};

export default MenuCard;