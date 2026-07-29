import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Check URL hash for auth type
        const hash = window.location.hash;
        const isRecovery = hash.includes('type=recovery');
        const isSignup = hash.includes('type=signup');

        // Supabase automatically processes the hash tokens
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setMessage('Erro ao processar: ' + error.message);
          return;
        }

        if (isRecovery) {
          // Password reset flow - user needs to set new password
          setStatus('success');
          setMessage('Sessão de recuperação validada. Redirecionar para definir nova palavra-passe...');
          setTimeout(() => navigate('/redefinir-palavra-passe'), 1500);
          return;
        }

        if (session) {
          setStatus('success');
          setMessage(isSignup ? 'Email confirmado com sucesso!' : 'Autenticado com sucesso!');
          setTimeout(() => navigate('/'), 1500);
        } else {
          // Try refreshing session
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            setStatus('error');
            setMessage('Erro ao confirmar. O link pode ter expirado.');
          } else {
            setStatus('success');
            setMessage('Autenticado com sucesso!');
            setTimeout(() => navigate('/'), 1500);
          }
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('Erro inesperado: ' + err.message);
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="font-serif text-4xl text-ink tracking-tight">300</h1>

        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 size={40} className="mx-auto text-ink animate-spin" strokeWidth={1.5} />
            <p className="text-olive font-sans">A processar...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-green-600" strokeWidth={1.5} />
            <p className="text-ink font-sans font-medium">{message}</p>
            <p className="text-olive text-sm font-sans">A redirecionar...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertTriangle size={40} className="mx-auto text-red-600" strokeWidth={1.5} />
            <p className="text-ink font-sans font-medium">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-ink underline hover:no-underline font-sans text-sm"
            >
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
