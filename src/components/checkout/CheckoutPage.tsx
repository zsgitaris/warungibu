
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import CheckoutForm from "./CheckoutForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutPageProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutPage = ({ user, onBack, onSuccess }: CheckoutPageProps) => {
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user.id],
    queryFn: async () => {
      console.log("Fetching cart items for checkout...");
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error fetching cart items:", error);
        throw error;
      }
      
      console.log("Cart items fetched successfully:", data);
      return data;
    },
  });

  const total = cartItems.reduce(
    (sum, item) => sum + (item.menu_items.price * item.quantity),
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Keranjang Anda kosong</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali Belanja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold ml-4">Checkout</h1>
      </div>

      <CheckoutForm
        user={user}
        cartItems={cartItems}
        total={total}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default CheckoutPage;
