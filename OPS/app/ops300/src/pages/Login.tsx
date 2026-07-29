import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou palavra-passe incorretos.' : error.message);
    } else {
      navigate('/');
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError('Introduza o seu email primeiro.');
      return;
    }
    setResendStatus('sending');
    const { error } = await resendConfirmation(email);
    if (error) {
      setError(error.message);
      setResendStatus('idle');
    } else {
      setResendStatus('sent');
      setError('');
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-ink tracking-tight">300</h1>
          <p className="text-olive text-sm mt-2 font-sans">Plataforma de Operações</p>
        </div>

        <Card className="border-line bg-ivory shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-ink text-center">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus === 'sent' && (
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  <span>Email de confirmação reenviado. Verifique a sua caixa de entrada.</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-ink font-sans text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilizador@empresa.pt"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-ivory border-line text-ink placeholder:text-olive/60"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-ink font-sans text-sm">Palavra-passe</Label>
                  <Link to="/recuperar-palavra-passe" className="text-xs text-olive hover:text-ink underline font-sans">
                    Esqueceu a palavra-passe?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-ivory border-line text-ink placeholder:text-olive/60"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-ink text-ivory hover:bg-ink/90 font-sans"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    A entrar...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center">
              <p className="text-sm text-olive font-sans">
                Não tem conta?{' '}
                <Link to="/registo" className="text-ink underline hover:no-underline">
                  Registar
                </Link>
              </p>
              <button
                onClick={handleResendConfirmation}
                disabled={resendStatus === 'sending'}
                className="text-xs text-olive hover:text-ink underline font-sans disabled:opacity-50"
              >
                {resendStatus === 'sending' ? 'A reenviar...' : 'Não recebeu o email de confirmação?'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
