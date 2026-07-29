// Telegram Bot integration for 300 OPS
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export interface TelegramAlertOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

export async function sendTelegramAlert(
  message: string,
  options?: TelegramAlertOptions
): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured (VITE_TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_CHAT_ID)');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id: CHAT_ID,
    text: options?.parse_mode === 'MarkdownV2' ? escapeMarkdown(message) : message,
    parse_mode: options?.parse_mode || 'HTML',
    disable_notification: options?.disable_notification || false,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('[Telegram] Failed to send alert:', data.description || response.statusText);
    }
  } catch (err) {
    console.error('[Telegram] Error sending alert:', err);
  }
}

export function isTelegramConfigured(): boolean {
  return !!BOT_TOKEN && !!CHAT_ID;
}
