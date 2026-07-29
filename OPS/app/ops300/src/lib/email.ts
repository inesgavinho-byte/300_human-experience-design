// Email notification utility for 300 OPS
import { supabase } from './supabase';

export async function sendEmailNotification(
  to: string,
  subject: string,
  content: string
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        to,
        subject,
        html: content,
        text: content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      },
    });

    if (error) {
      console.error('[Email] Edge function error:', error);
      console.log('[Email] Fallback — would send email:', { to, subject });
    }
  } catch (err) {
    console.error('[Email] Failed to invoke edge function:', err);
    console.log('[Email] Fallback — would send email:', { to, subject });
  }
}
