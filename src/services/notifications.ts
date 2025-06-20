// src/services/notifications.ts
export async function notifyByTelegram(order: {
  id: string;
  order_number?: string;
  customer_name?: string;
  total_amount?: number;
}) {
  const token  = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Telegram credentials not set');
    return;
  }

  // Format total dengan rupiah, jika ada
  const totalFormatted = order.total_amount != null
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(order.total_amount)
    : '';

  const text = `🌟 Pesanan Baru!\n` +
    `• ID: ${order.id}\n` +
    (order.order_number ? `• No. Pesanan: ${order.order_number}\n` : '') +
    (order.customer_name ? `• Pelanggan: ${order.customer_name}\n` : '') +
    (totalFormatted ? `• Total: ${totalFormatted}` : '');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        })
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
    }
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}
