// Daily Notifications Edge Function
// Envia notificações para eventos do dia respeitando preferências do utilizador

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Data de hoje (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour < 12; // antes do meio-dia = manhã

    // Buscar eventos do dia
    const [visits, procurements, invoices, projects] = await Promise.all([
      supabase.from('maintenance_visits').select('*, projects(name)').eq('scheduled_date', today),
      supabase.from('procurement_tasks').select('*, projects(name)').eq('due_date', today),
      supabase.from('invoices').select('*, projects(name)').eq('due_date', today),
      supabase.from('projects').select('*').or(`start_date.eq.${today},end_date.eq.${today}`),
    ]);

    const events: any[] = [];

    (visits.data || []).forEach((v: any) => events.push({
      type: 'visit',
      title: v.type === 'preventive' ? 'Visita Preventiva' : 'Visita Corretiva',
      project: v.projects?.name || 'Sem projeto',
      time: v.scheduled_time || '09:00',
      status: v.status,
    }));

    (procurements.data || []).forEach((p: any) => events.push({
      type: 'procurement',
      title: p.title,
      project: p.projects?.name || 'Sem projeto',
      time: '09:00',
      status: p.status,
    }));

    (invoices.data || []).forEach((i: any) => events.push({
      type: 'invoice',
      title: `Fatura ${i.number}`,
      project: i.projects?.name || 'Sem projeto',
      time: '09:00',
      amount: i.amount,
      status: i.status,
    }));

    (projects.data || []).forEach((p: any) => events.push({
      type: 'project',
      title: p.start_date === today ? `Início: ${p.name}` : `Entrega: ${p.name}`,
      project: p.name,
      time: '09:00',
      status: p.status,
    }));

    if (events.length === 0) {
      return new Response(JSON.stringify({ message: 'Sem eventos hoje' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Buscar utilizadores com notificações ativas e respeitar preferências
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, telegram_chat_id, notify_email, notify_telegram, notify_visit, notify_procurement, notify_invoice, notify_project, notify_morning, notify_evening');

    const results: any[] = [];

    for (const user of users || []) {
      // Filtrar eventos conforme preferências do utilizador
      const userEvents = events.filter(e => {
        if (e.type === 'visit' && !user.notify_visit) return false;
        if (e.type === 'procurement' && !user.notify_procurement) return false;
        if (e.type === 'invoice' && !user.notify_invoice) return false;
        if (e.type === 'project' && !user.notify_project) return false;
        return true;
      });

      if (userEvents.length === 0) continue;

      // Verificar horário preferido
      if (isMorning && !user.notify_morning) continue;
      if (!isMorning && !user.notify_evening) continue;

      // Enviar email
      if (RESEND_API_KEY && user.notify_email && user.email) {
        const html = buildEmailHTML(user.full_name || 'Utilizador', today, userEvents);

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '300 OPS <notifications@300-humandesignexperience.com>',
            to: user.email,
            subject: `📅 300 OPS — Eventos de ${new Date(today).toLocaleDateString('pt-PT')}`,
            html,
          }),
        });

        results.push({ channel: 'email', to: user.email, status: res.status });
      }

      // Enviar Telegram
      if (TELEGRAM_BOT_TOKEN && user.notify_telegram && user.telegram_chat_id) {
        const text = buildTelegramMessage(today, userEvents);

        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text,
            parse_mode: 'HTML',
          }),
        });

        results.push({ channel: 'telegram', to: user.telegram_chat_id, status: res.status });
      }

      // Guardar notificações na base de dados (por utilizador)
      await supabase.from('notifications').insert(
        userEvents.map(e => ({
          title: e.title,
          message: `${e.title} — ${e.project}`,
          type: e.type,
          date: today,
          user_id: user.id,
          sent_at: new Date().toISOString(),
        }))
      );
    }

    return new Response(JSON.stringify({
      message: `Notificações enviadas: ${events.length} eventos para ${users?.length || 0} utilizadores`,
      events,
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

function buildEmailHTML(name: string, date: string, events: any[]): string {
  const dateStr = new Date(date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const rows = events.map(e => {
    const icon = e.type === 'visit' ? '🔧' : e.type === 'procurement' ? '📦' : e.type === 'invoice' ? '💰' : '📁';
    return `<tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">${icon}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;font-weight:600;">${e.title}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;color:#666;">${e.project}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;"><span style="background:${getStatusColor(e.status)};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${e.status || '—'}</span></td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f7;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 8px;">300 OPS</h1>
    <p style="color:#666;margin:0 0 24px;">Olá ${name}, aqui estão os seus eventos de hoje:</p>
    <h2 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 16px;font-size:18px;">${dateStr}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="text-align:left;color:#666;font-size:12px;text-transform:uppercase;">
        <th style="padding:8px 12px;"></th><th style="padding:8px 12px;">Evento</th>
        <th style="padding:8px 12px;">Projeto</th><th style="padding:8px 12px;">Estado</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#999;text-align:center;">
      <a href="https://300-humandesignexperience.netlify.app/calendario" style="color:#1a1a1a;text-decoration:underline;">Ver no Calendário 300 OPS →</a>
    </p>
  </div>
</body>
</html>`;
}

function buildTelegramMessage(date: string, events: any[]): string {
  const dateStr = new Date(date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  const lines = events.map(e => {
    const icon = e.type === 'visit' ? '🔧' : e.type === 'procurement' ? '📦' : e.type === 'invoice' ? '💰' : '📁';
    return `${icon} <b>${e.title}</b> — ${e.project}`;
  });
  return `📅 <b>300 OPS — ${dateStr}</b>\n\n${lines.join('\n')}\n\n<a href="https://300-humandesignexperience.netlify.app/calendario">Ver Calendário</a>`;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    done: '#10b981', pending: '#f59e0b', overdue: '#ef4444',
    paid: '#10b981', unpaid: '#ef4444', draft: '#6b7280',
    active: '#3b82f6', completed: '#10b981', cancelled: '#6b7280',
  };
  return colors[status] || '#6b7280';
}
