
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import PaymentModal from "./PaymentModal";
import { createOrderNotification } from "@/utils/notificationUtils";

interface CartItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  menu_items: {
    name: string;
    price: number;
  };
}

interface CheckoutFormProps {
  user: User;
  cartItems: CartItem[];
  total: number;
  onSuccess: () => void;
}

interface CreatedOrder {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CreateOrderParams {
  p_user_id: string;
  p_customer_name: string;
  p_customer_phone: string;
  p_delivery_address: string;
  p_notes: string | null;
  p_total_amount: number;
  p_order_items: OrderItem[];
}

const CheckoutForm = ({ user, cartItems, total, onSuccess }: CheckoutFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePhoneChange = (value: string) => {
    // Remove any non-numeric characters except + at the beginning
    const cleanValue = value.replace(/[^0-9+]/g, '');
    // Ensure + is only at the beginning
    const formattedValue = cleanValue.replace(/\+/g, '').replace(/^/, cleanValue.startsWith('+') ? '+' : '');
    setCustomerPhone(formattedValue);
  };

  const createOrderMutation = useMutation({
    mutationFn: async (): Promise<CreatedOrder> => {
      console.log("Starting order creation process...");
      console.log("User ID:", user.id);
      console.log("Cart items:", cartItems);
      console.log("Form data:", {
        customerName,
        customerPhone,
        deliveryAddress,
        notes,
        total
      });

      // Validate required fields
      if (!customerName.trim()) {
        throw new Error("Nama lengkap harus diisi");
      }
      if (!customerPhone.trim()) {
        throw new Error("Nomor WhatsApp harus diisi");
      }
      if (!deliveryAddress.trim()) {
        throw new Error("Alamat pengiriman harus diisi");
      }
      if (cartItems.length === 0) {
        throw new Error("Keranjang belanja kosong");
      }
      if (total <= 0) {
        throw new Error("Total pesanan tidak valid");
      }

      // Enhanced validation for each cart item
      for (const item of cartItems) {
        console.log("Validating cart item:", item);
        
        if (!item.menu_items) {
          console.error("Menu items data missing for item:", item);
          throw new Error("Data menu item tidak lengkap. Silakan refresh keranjang belanja Anda.");
        }
        
        // Use menu_item_id from the cart item instead of menu_items.id
        if (!item.menu_item_id) {
          console.error("Menu item ID missing for item:", item);
          throw new Error("ID menu item tidak valid. Silakan refresh keranjang belanja Anda.");
        }
        
        if (!item.menu_items.name || item.menu_items.name.trim() === '') {
          console.error("Menu item name missing for item:", item);
          throw new Error("Nama menu item tidak valid. Silakan refresh keranjang belanja Anda.");
        }
        
        if (!item.menu_items.price || item.menu_items.price <= 0) {
          console.error("Menu item price invalid for item:", item);
          throw new Error("Harga menu item tidak valid. Silakan refresh keranjang belanja Anda.");
        }
        
        if (!item.quantity || item.quantity <= 0) {
          console.error("Invalid quantity for item:", item);
          throw new Error("Jumlah item tidak valid");
        }
      }

      // Prepare order items data using menu_item_id
      const orderItems: OrderItem[] = cartItems.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.menu_items.price,
        subtotal: item.menu_items.price * item.quantity
      }));

      console.log("Prepared order items:", orderItems);

      // Prepare parameters for the RPC call
      const rpcParams: CreateOrderParams = {
        p_user_id: user.id,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_delivery_address: deliveryAddress.trim(),
        p_notes: notes.trim() || null,
        p_total_amount: total,
        p_order_items: orderItems
      };

      console.log("RPC parameters:", rpcParams);

      // Use database transaction to ensure data consistency with explicit typing
      const { data: orderResult, error: orderError } = await (supabase.rpc as any)('create_order_with_items', rpcParams) as {
        data: CreatedOrder[] | null;
        error: any;
      };

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error(`Gagal membuat pesanan: ${orderError.message}`);
      }

      if (!orderResult || !Array.isArray(orderResult) || orderResult.length === 0) {
        throw new Error("Pesanan berhasil dibuat tetapi tidak dapat mengambil data pesanan");
      }

      const order = orderResult[0] as CreatedOrder;
      console.log("Order created successfully:", order);

      // Verify order items were created
      const { data: verifyItems, error: itemsCheckError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsCheckError) {
        console.error("Error checking order items:", itemsCheckError);
        throw new Error("Gagal memverifikasi item pesanan");
      }

      if (!verifyItems || verifyItems.length === 0) {
        console.error("No order items found after order creation");
        throw new Error("Item pesanan tidak berhasil disimpan. Silakan hubungi customer service.");
      }

      if (verifyItems.length !== cartItems.length) {
        console.error(`Order items count mismatch. Expected: ${cartItems.length}, Got: ${verifyItems.length}`);
        throw new Error("Tidak semua item pesanan berhasil disimpan. Silakan hubungi customer service.");
      }

      console.log("Order items verified successfully:", verifyItems);

      // Clear cart only after successful order creation and verification
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (cartError) {
        console.error("Cart clear error:", cartError);
        // Don't throw error here as the order is already created
        console.warn("Failed to clear cart, but order was created successfully");
      }

      console.log("Order creation process completed successfully");
      return order;
    },
    onSuccess: async (order) => {
      console.log("Order mutation completed successfully:", order);
      
      // Create notification for successful order
      try {
        await createOrderNotification(
          user.id,
          order.order_number,
          'pending',
          `Pesanan ${order.order_number} berhasil dibuat dengan total ${formatPrice(order.total_amount)}. Kami akan segera memproses pesanan Anda.`
        );
        console.log("Order notification created successfully");
      } catch (error) {
        console.error("Failed to create order notification:", error);
        // Don't throw error here as order was created successfully
      }

      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      
      toast({
        title: "Pesanan Berhasil",
        description: `Pesanan ${order.order_number} telah dibuat dan sedang diproses`,
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Order mutation error:", error);
      toast({
        title: "Gagal Membuat Pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with values:", {
      customerName,
      customerPhone,
      deliveryAddress,
      notes
    });

    // Client-side validation
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Nama lengkap asli harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Error",
        description: "Nomor WhatsApp aktif harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Alamat pengiriman asli harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang belanja kosong",
        variant: "destructive",
      });
      return;
    }

    // Show payment modal instead of directly creating order
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    createOrderMutation.mutate();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Detail Pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap Asli *</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama lengkap asli Anda"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nomor WhatsApp Aktif *</label>
              <Input
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Masukkan nomor WhatsApp aktif"
                onKeyDown={(e) => {
                  // Only allow numbers, backspace, delete, tab, escape, enter, and +
                  if (![8, 9, 27, 13, 46, 110, 190].includes(e.keyCode) &&
                      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (e.keyCode !== 65 || !e.ctrlKey) &&
                      (e.keyCode !== 67 || !e.ctrlKey) &&
                      (e.keyCode !== 86 || !e.ctrlKey) &&
                      (e.keyCode !== 88 || !e.ctrlKey) &&
                      // Ensure that it is a number or + (and + only at the beginning)
                      ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 107)) {
                    e.preventDefault();
                  }
                }}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Alamat Pengiriman Asli *</label>
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Masukkan alamat pengiriman asli dan lengkap"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan khusus untuk pesanan"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.menu_items.name} x {item.quantity}</span>
                  <span>{formatPrice(item.menu_items.price * item.quantity)}</span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? "Memproses..." : "Buat Pesanan"}
        </Button>
      </form>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        total={total}
      />
    </>
  );
};

export default CheckoutForm;
