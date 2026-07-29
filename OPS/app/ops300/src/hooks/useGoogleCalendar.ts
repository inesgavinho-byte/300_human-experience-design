import { useState, useCallback, useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://iiiicrfhqwsltswmfvld.functions.supabase.co';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  colorId?: string;
}

export function useGoogleCalendar() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar se já existe token guardado
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setAccessToken(token);
      setIsSignedIn(true);
      fetchGoogleEvents(token);
    }
  }, []);

  // Iniciar OAuth flow
  const signIn = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID não configurado');
      return;
    }

    const redirectUri = `${window.location.origin}/calendario`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
    const state = btoa(JSON.stringify({ redirect: '/calendario' }));

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&prompt=consent`;

    window.location.href = authUrl;
  }, []);

  // Processar token do URL (OAuth redirect)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        localStorage.setItem('google_access_token', token);
        setAccessToken(token);
        setIsSignedIn(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchGoogleEvents(token);
      }
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('google_access_token');
    setAccessToken(null);
    setIsSignedIn(false);
    setGoogleEvents([]);
  }, []);

  const fetchGoogleEvents = useCallback(async (token?: string) => {
    const t = token || accessToken;
    if (!t) return;

    setIsLoading(true);
    setError('');

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const res = await fetch(`${FUNCTIONS_URL}/google-calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: t,
          action: 'list-events',
          timeMin,
          timeMax,
        }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.error.message?.includes('invalid_token') || data.error.message?.includes('expired')) {
          signOut();
          setError('Sessão Google expirada. Por favor, volte a ligar.');
        } else {
          setError(data.error.message || 'Erro ao carregar eventos Google');
        }
      } else {
        setGoogleEvents(data.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos Google');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, signOut]);

  // Criar evento no Google Calendar
  const createGoogleEvent = useCallback(async (event: {
    title: string;
    date: string;
    type: string;
    description?: string;
    projectName?: string;
  }) => {
    if (!accessToken) return { error: 'Não autenticado' };

    try {
      const res = await fetch(`${FUNCTIONS_URL}/google-calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          action: 'create',
          event,
        }),
      });

      return await res.json();
    } catch (err: any) {
      return { error: err.message };
    }
  }, [accessToken]);

  return {
    isSignedIn,
    accessToken,
    googleEvents,
    isLoading,
    error,
    signIn,
    signOut,
    fetchGoogleEvents,
    createGoogleEvent,
  };
}
