// Slack integration for 300 OPS
const WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

export interface SlackAlertOptions {
  channel?: string;
  username?: string;
}

export async function sendSlackAlert(
  message: string,
  options?: SlackAlertOptions
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn('[Slack] No webhook URL configured (VITE_SLACK_WEBHOOK_URL)');
    return;
  }

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '300 OPS · Alerta',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ];

  const payload: Record<string, unknown> = {
    text: message.replace(/[*>`]/g, ''),
    blocks,
  };

  if (options?.channel) payload.channel = options.channel;
  if (options?.username) payload.username = options.username;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Slack] Failed to send alert:', response.status, await response.text());
    }
  } catch (err) {
    console.error('[Slack] Error sending alert:', err);
  }
}
