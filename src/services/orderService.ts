import { supabase } from '@/integrations/supabase/client';
import { notifyByTelegram } from './notifications';
import { notifyByTelegram } from './notifications';

interface OrderSubscriptionCallbacks {
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (order: any) => void;
}

class OrderService {
  private channel: any = null;
  private callbacks: OrderSubscriptionCallbacks = {};

  /**
   * Initialize the OrderService by setting up real-time Supabase notifications
   * for orders. This method wires up the global subscription that listens for
   * INSERT and UPDATE events on the orders table.
   * 
   * @returns A cleanup function that unsubscribes from the real-time channel
   */
  initialize(): () => void {
    // If already subscribed, return cleanup
    if (this.channel) {
      return () => this.unsubscribeFromOrders();
    }

    // Set up real-time channel for orders
    this.channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async ({ new: newOrder }) => {
          console.log('🆕 New order received:', newOrder);

          // Determine current user role
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          // For admin: In-app and Telegram notifications
          if (profile?.role === 'admin') {
            // Telegram notification (do not await to not block)
            notifyByTelegram(newOrder).catch(err =>
              console.error('Telegram notify error:', err)
            );
            // In-app notification via callback
            this.callbacks.onNewOrder?.(newOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        ({ new: updatedOrder }) => {
          console.log('♻️ Order updated:', updatedOrder);
          this.callbacks.onOrderUpdate?.(updatedOrder);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => this.unsubscribeFromOrders();
  }

  /**
   * Subscribe to order events by registering callbacks with the global subscription.
   * If no global subscription exists, this will create one.
   * 
   * @param callbacks - Object containing callback functions for order events
   * @returns A function to unregister the callbacks
   */
  subscribeToOrders(callbacks: OrderSubscriptionCallbacks) {
    // Register callbacks
    this.callbacks = { ...this.callbacks, ...callbacks };

    // If no subscription exists, initialize it
    if (!this.channel) {
      this.initialize();
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

  /**
   * Unsubscribe from the real-time channel and clear callbacks
   */
  unsubscribeFromOrders() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.callbacks = {};
  }

  async markAdminNotified(orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notified_admin: true })
        .eq('id', orderId);

      if (error) console.error('Error marking admin as notified:', error);
    } catch (error) {
      console.error('Error in markAdminNotified:', error);
    }
  }

  async getUnnotifiedOrdersCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('notified_admin', false);

      if (error) {
        console.error('Error getting unnotified orders count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error in getUnnotifiedOrdersCount:', error);
      return 0;
    }
  }

  async getUnnotifiedOrders(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          total_amount,
          created_at,
          status
        `)
        .eq('notified_admin', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error getting unnotified orders:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getUnnotifiedOrders:', error);
      return [];
    }
  }

  async markAllAdminNotified(): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notified_admin: true })
        .eq('notified_admin', false);

      if (error) console.error('Error marking all admin as notified:', error);
    } catch (error) {
      console.error('Error in markAllAdminNotified:', error);
    }
  }
}

export const orderService = new OrderService();