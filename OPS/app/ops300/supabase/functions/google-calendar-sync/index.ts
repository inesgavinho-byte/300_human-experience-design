// Google Calendar Sync Edge Function
// Sincroniza eventos da plataforma 300 OPS com Google Calendar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'visit' | 'procurement' | 'invoice' | 'project';
  description?: string;
  projectName?: string;
}

serve(async (req) => {
  const { method } = req;

  // CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken, event, action = 'create' } = body;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Listar calendários do utilizador
    if (action === 'list-calendars') {
      const res = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Criar evento no Google Calendar
    if (action === 'create' && event) {
      const calendarId = body.calendarId || 'primary';

      const googleEvent = {
        summary: event.title,
        description: `${event.description || ''}\n\nTipo: ${event.type}\nProjeto: ${event.projectName || 'N/A'}\nID 300: ${event.id}`,
        start: {
          date: event.date, // all-day event
        },
        end: {
          date: event.date,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 1 dia antes
            { method: 'popup', minutes: 60 },   // 1 hora antes
          ],
        },
        colorId: getColorId(event.type),
      };

      const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Listar eventos do Google Calendar
    if (action === 'list-events') {
      const calendarId = body.calendarId || 'primary';
      const timeMin = body.timeMin || new Date().toISOString();
      const timeMax = body.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Eliminar evento
    if (action === 'delete' && body.eventId) {
      const calendarId = body.calendarId || 'primary';
      const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${body.eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return new Response(JSON.stringify({ success: res.status === 204 }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

function getColorId(type: string): string {
  // Google Calendar color IDs
  const colors: Record<string, string> = {
    visit: '2',       // sage green
    procurement: '1', // blue
    invoice: '5',     // yellow
    project: '3',     // purple
  };
  return colors[type] || '0';
}
