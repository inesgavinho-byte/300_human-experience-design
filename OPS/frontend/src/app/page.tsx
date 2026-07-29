'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { Building2, Cpu, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    window.location.href = '/dashboard';
  };

  if (isAuthenticated && typeof window !== 'undefined') {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
        <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold shadow-lg">
                300
              </div>
              <span className="text-3xl font-bold tracking-tight">OPS</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Engenharia para<br />
              <span className="text-primary">Edifícios Inteligentes</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Plataforma completa de engenharia para projeto, prescrição, integração
              e gestão de edifícios inteligentes de luxo.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Projeto Completo</p>
                  <p className="text-sm text-muted-foreground">Do mandato à entrega</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Automação Total</p>
                  <p className="text-sm text-muted-foreground">KNX, DALI, BACnet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <Cpu className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="font-medium">IA Local</p>
                  <p className="text-sm text-muted-foreground">Privacidade garantida</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Segurança</p>
                  <p className="text-sm text-muted-foreground">CCTV & controlo de acessos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-xl border bg-card p-8 shadow-lg">
              <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aceda à plataforma 300 OPS
              </p>
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="eng@300ops.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Palavra-passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
