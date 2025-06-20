
import { supabase } from '@/integrations/supabase/client';

export const createWelcomeNotifications = async (userId: string, userRole: string) => {
  const notifications = [];

  if (userRole === 'admin') {
    notifications.push(
      {
        user_id: userId,
        title: 'Selamat Datang Admin!',
        message: 'Anda telah berhasil login sebagai administrator. Kelola menu, pesanan, dan pengguna dengan mudah.',
        type: 'welcome',
        target_page: 'admin',
      },
      {
        user_id: userId,
        title: 'Dashboard Admin',
        message: 'Akses dashboard admin untuk melihat statistik dan mengelola sistem.',
        type: 'info',
        target_page: 'admin',
      }
    );
  } else {
    notifications.push(
      {
        user_id: userId,
        title: 'Selamat Datang di Warung IbuMus!',
        message: 'Terima kasih telah bergabung dengan kami. Nikmati berbagai menu lezat dan pelayanan terbaik.',
        type: 'welcome',
        target_page: 'menu',
      },
      {
        user_id: userId,
        title: 'Promo Spesial Member Baru!',
        message: 'Dapatkan diskon 15% untuk pembelian pertama Anda. Gunakan kode: NEWMEMBER',
        type: 'promo',
        target_page: 'menu',
      },
      {
        user_id: userId,
        title: 'Lengkapi Profil Anda',
        message: 'Lengkapi profil Anda untuk pengalaman berbelanja yang lebih personal.',
        type: 'info',
        target_page: 'profile',
      }
    );
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (error) {
      console.error('Error creating welcome notifications:', error);
    }
  } catch (error) {
    console.error('Exception creating welcome notifications:', error);
  }
};

export const createOrderNotification = async (
  userId: string,
  orderNumber: string,
  status: string,
  customMessage?: string
) => {
  const statusMessages = {
    pending: `Pesanan ${orderNumber} telah diterima dan sedang diproses`,
    confirmed: `Pesanan ${orderNumber} telah dikonfirmasi dan sedang disiapkan`,
    preparing: `Pesanan ${orderNumber} sedang disiapkan oleh dapur kami`,
    ready: `Pesanan ${orderNumber} sudah siap untuk dikirim`,
    delivered: `Pesanan ${orderNumber} telah berhasil dikirim ke alamat tujuan`,
    cancelled: `Pesanan ${orderNumber} telah dibatalkan`,
  };

  const notification = {
    user_id: userId,
    title: 'Update Pesanan',
    message: customMessage || statusMessages[status as keyof typeof statusMessages] || `Status pesanan ${orderNumber} telah diperbarui`,
    type: 'order',
    target_page: 'profile',
    target_tab: 'orders',
  };

  try {
    const { error } = await supabase
      .from('notifications')
      .insert([notification]);
    
    if (error) {
      console.error('Error creating order notification:', error);
    }
  } catch (error) {
    console.error('Exception creating order notification:', error);
  }
};
