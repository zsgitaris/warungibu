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

  const totalFormatted = order.total_amount != null
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(order.total_amount)
    : '';

  const textLines = [
    '🌟 *Pesanan Baru!*',
    `• *ID:* ${order.id}`,
    order.order_number ? `• *No. Pesanan:* ${order.order_number}` : null,
    order.customer_name ? `• *Pelanggan:* ${order.customer_name}` : null,
    totalFormatted ? `• *Total:* ${totalFormatted}` : null,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textLines,
          parse_mode: 'Markdown'
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
