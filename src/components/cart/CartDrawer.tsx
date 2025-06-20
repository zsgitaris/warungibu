import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingBag, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface CartItem {
  id: string;
  quantity: number;
  menu_items: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCheckout: () => void;
  user?: User;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onCheckout,
  user
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const total = cartItems.reduce((sum, item) => sum + item.menu_items.price * item.quantity, 0);

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
    onError: (error) => {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus item dari keranjang",
        variant: "destructive",
      });
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, newQuantity }: { itemId: string, newQuantity: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { itemId, newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate kuantitas item",
        variant: "destructive",
      });
    }
  });

  const handleRemoveItem = (item: CartItem) => {
    removeItemMutation.mutate(item.id);
    toast({
      title: "🗑️ Item Dihapus",
      description: `${item.menu_items.name} telah dihapus dari keranjang`,
      className: "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300 shadow-lg"
    });
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantityMutation.mutate({ itemId: id, newQuantity });
      const item = cartItems.find(item => item.id === id);
      toast({
        title: "✅ Kuantitas Diperbarui",
        description: `${item?.menu_items.name} - ${newQuantity} item`,
        className: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-300 shadow-lg"
      });
    } else {
      // If quantity is 0, remove the item
      const item = cartItems.find(item => item.id === id);
      if (item) {
        handleRemoveItem(item);
      }
    }
  };

  const handleCheckout = () => {
    onCheckout();
    toast({
      title: "🛒 Menuju Checkout",
      description: "Anda akan diarahkan ke halaman pembayaran",
      className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-lg animate-slide-up"
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        className="max-h-[80vh] bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 border-t-4 border-orange-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 237, 213, 0.4) 50%, rgba(255, 243, 224, 0.4) 100%)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <DrawerHeader 
          className="border-b border-orange-200/50 bg-gradient-to-r from-orange-100/60 to-amber-100/60"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.8) 0%, rgba(255, 243, 224, 0.8) 100%)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-medium">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              Keranjang Belanja
              <Badge 
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-soft"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {cartItems.length} item
              </Badge>
            </DrawerTitle>
            <DrawerClose>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full hover:bg-orange-200/50 text-gray-600 hover:text-gray-800 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 text-lg font-medium">Keranjang kosong</p>
              <p className="text-gray-500 text-sm">Tambahkan item dari menu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-orange-200/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.menu_items.image_url}
                      alt={item.menu_items.name}
                      className="w-16 h-16 object-cover rounded-xl shadow-soft"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.menu_items.name}</h3>
                      <p className="text-orange-600 font-bold">
                        Rp {item.menu_items.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0 rounded-full border-orange-300 hover:bg-orange-100 text-gray-700 hover:text-gray-900"
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0 rounded-full border-orange-300 hover:bg-orange-100 text-gray-700 hover:text-gray-900"
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveItem(item)}
                        className="w-8 h-8 p-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 shadow-soft"
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div 
            className="border-t border-orange-200/50 p-4 bg-gradient-to-r from-orange-100/60 to-amber-100/60"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.8) 0%, rgba(255, 243, 224, 0.8) 100%)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-orange-600">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 border-0"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
              }}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Checkout
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;