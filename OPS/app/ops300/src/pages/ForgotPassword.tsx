import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
            <CardTitle className="font-serif text-xl text-ink text-center">Recuperar Palavra-passe</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-3">
                <CheckCircle2 size={40} className="mx-auto text-ink" strokeWidth={1.5} />
                <p className="text-ink font-sans font-medium">Email enviado!</p>
                <p className="text-olive text-sm font-sans">
                  Verifique o seu email e clique no link para redefinir a palavra-passe.
                </p>
                <Link to="/login" className="text-ink underline hover:no-underline text-sm font-sans inline-flex items-center gap-1 mt-2">
                  <ArrowLeft size={14} /> Voltar ao login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-ink text-ivory hover:bg-ink/90 font-sans"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-olive mt-4 font-sans">
              <Link to="/login" className="text-ink underline hover:no-underline inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Voltar ao login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
