-import { supabase } from '@/integrations/supabase/client';
+import { supabase } from '@/integrations/supabase/client';
 import { notifyByTelegram } from './notifications';
 
 interface OrderSubscriptionCallbacks {
   onNewOrder?: (order: any) => void;
   onOrderUpdate?: (order: any) => void;
 }
 
 class OrderService {
-  private subscription: any = null;
+  private channel: any = null;
   private callbacks: OrderSubscriptionCallbacks = {};
 
   /**
@@
-  initialize(): () => void {
-    // Clean up existing subscription if any
-    if (this.subscription) {
-      this.subscription.unsubscribe();
-    }
-
-    this.subscription = supabase
-      .channel('orders-changes')
+  initialize(): () => void {
+    // Jika sudah subscribe, skip
+    if (this.channel) return () => this.unsubscribeFromOrders();
+
+    this.channel = supabase
+      .channel('public:orders')
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'orders',
         },
         async (payload) => {
           const newOrder = payload.new;
           console.log('🆕 New order received:', newOrder);
 
           // Cek role current user
           const { data: { user } } = await supabase.auth.getUser();
           if (!user) return;
 
           const { data: profile } = await supabase
             .from('profiles')
             .select('role')
             .eq('id', user.id)
             .single();
 
           if (profile?.role === 'admin') {
-            // For admin: send Telegram notification and add to in-app queue
-            await notifyByTelegram(newOrder);
-            this.callbacks.onNewOrder?.(newOrder);
+            // 1) Kirim Telegram
+            notifyByTelegram(newOrder).catch(err =>
+              console.error('Telegram notify error:', err)
+            );
+            // 2) In‐app notification
+            this.callbacks.onNewOrder?.(newOrder);
           }
         }
       )
-      .on(
+      .on(
         'postgres_changes',
         {
           event: 'UPDATE',
           schema: 'public',
           table: 'orders',
         },
         (payload) => {
           console.log('♻️ Order updated:', payload.new);
           this.callbacks.onOrderUpdate?.(payload.new);
         }
       )
       .subscribe();
-
-    // Return cleanup function
-    return () => {
-      this.unsubscribeFromOrders();
-    };
+    // Kembalikan cleanup function
+    return () => this.unsubscribeFromOrders();
   }
 
   /**
@@
   subscribeToOrders(callbacks: OrderSubscriptionCallbacks) {
     // Register callbacks
     this.callbacks = { ...this.callbacks, ...callbacks };
 
     // If no subscription exists, initialize it
-    if (!this.subscription) {
-      this.initialize();
+    if (!this.channel) {
+      this.initialize();
     }
 
     // Return function to unregister these specific callbacks
     return () => {
       if (callbacks.onNewOrder) {
         delete this.callbacks.onNewOrder;
       }
       if (callbacks.onOrderUpdate) {
         delete this.callbacks.onOrderUpdate;
       }
     };
   }
 
   unsubscribeFromOrders() {
-    if (this.subscription) {
-      this.subscription.unsubscribe();
-      this.subscription = null;
+    if (this.channel) {
+      supabase.removeChannel(this.channel);
+      this.channel = null;
     }
     // Clear all callbacks
     this.callbacks = {};
   }
@@
 }
 
-export const orderService = new OrderService();
+export const orderService = new OrderService();