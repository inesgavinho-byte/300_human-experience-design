import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, CheckCircle2, User, Mail, Shield } from 'lucide-react';

export default function Profile() {
  const { user, profile, updateProfile, updatePassword } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    const { error } = await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Perfil atualizado com sucesso.');
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsPasswordLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsPasswordLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Palavra-passe atualizada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  const roleLabel = profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Gestor' : 'Membro';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl text-ink">Perfil</h1>
        <p className="text-olive text-sm mt-1 font-sans">Gerir informações da conta</p>
      </div>

      {success && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Informações da conta */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <User size={16} strokeWidth={1.5} />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm font-sans">
            <Mail size={14} className="text-olive" />
            <span className="text-olive">Email</span>
            <span className="text-ink ml-auto">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-sans">
            <Shield size={14} className="text-olive" />
            <span className="text-olive">Função</span>
            <span className="text-ink ml-auto">{roleLabel}</span>
          </div>
        </CardContent>
      </Card>

      {/* Editar perfil */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink">Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-ink font-sans text-sm">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="João Manuel"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-ink font-sans text-sm">URL do Avatar (opcional)</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-ink text-ivory hover:bg-ink/90 font-sans"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                'Guardar Alterações'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar palavra-passe */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink">Alterar Palavra-passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-ink font-sans text-sm">Nova Palavra-passe</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                className="bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-ink font-sans text-sm">Confirmar Nova Palavra-passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>

            <Button
              type="submit"
              disabled={isPasswordLoading}
              className="bg-ink text-ivory hover:bg-ink/90 font-sans"
            >
              {isPasswordLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  A atualizar...
                </>
              ) : (
                'Atualizar Palavra-passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
