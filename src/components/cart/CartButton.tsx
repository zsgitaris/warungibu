
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import CartDrawer from "./CartDrawer";

interface CartButtonProps {
  user: User;
  onCheckout: () => void;
}

const CartButton = ({ user, onCheckout }: CartButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (
            name,
            price,
            image_url
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  const itemCount = cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="w-4 h-4" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
      
      <CartDrawer 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        cartItems={cartItems || []}
        onCheckout={onCheckout}
        user={user}
      />
    </>
  );
};

export default CartButton;
