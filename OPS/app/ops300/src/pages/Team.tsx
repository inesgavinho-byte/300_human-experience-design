import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, UsersRound, Mail, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  email_confirmed_at?: string | null;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-ink text-ivory',
  manager: 'bg-olive/20 text-ink',
  member: 'bg-line/40 text-ink',
};

export default function Team() {
  const { user: currentUser, isAdmin } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setIsLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setMembers((data || []) as TeamMember[]);
    }
    setIsLoading(false);
  }

  async function updateRole(memberId: string, newRole: UserRole) {
    setError('');
    setSuccess('');
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Função atualizada com sucesso.');
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    }
  }

  async function deleteMember(memberId: string) {
    if (!confirm('Tem a certeza que deseja remover este utilizador? Esta ação não pode ser desfeita.')) return;

    setDeletingId(memberId);
    setError('');
    setSuccess('');

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Utilizador removido.');
      setMembers(prev => prev.filter(m => m.id !== memberId));
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Equipa</h1>
          <p className="text-olive text-sm mt-1 font-sans">Gerir membros e permissões</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-olive font-sans">
          <UsersRound size={16} />
          <span>{members.length} membro{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Convite */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <Mail size={16} strokeWidth={1.5} />
            Convidar Novo Membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-olive font-sans mb-3">
            Partilhe o link de registo com novos membros. Após o registo, pode alterar a função deles aqui.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/registo`}
              className="bg-white border-line text-ink font-sans text-sm"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/registo`);
                setSuccess('Link copiado!');
              }}
              className="bg-ink text-ivory hover:bg-ink/90 font-sans shrink-0"
            >
              Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de membros */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <UsersRound size={16} strokeWidth={1.5} />
            Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-ink" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-olive font-sans py-4">Sem membros registados.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 p-3 rounded-md border border-line bg-white ${
                    member.id === currentUser?.id ? 'ring-1 ring-ink/20' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-ink text-ivory flex items-center justify-center text-sm font-sans shrink-0">
                    {(member.full_name || member.email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-medium text-ink truncate">
                        {member.full_name || 'Sem nome'}
                      </span>
                      {member.id === currentUser?.id && (
                        <span className="text-[10px] text-olive font-sans">(você)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-olive font-sans">
                      <Mail size={12} />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>

                    {member.email_confirmed_at ? (
                      <CheckCircle2 size={14} className="text-green-600" />
                    ) : (
                      <span title="Email não confirmado">
                        <XCircle size={14} className="text-amber-500" />
                      </span>
                    )}

                    {isAdmin && member.id !== currentUser?.id && (
                      <>
                        <select
                          value={member.role}
                          onChange={e => updateRole(member.id, e.target.value as UserRole)}
                          className="text-xs border border-line rounded-md px-1.5 py-0.5 bg-white font-sans disabled:opacity-50"
                        >
                          <option value="admin">Administrador</option>
                          <option value="manager">Gestor</option>
                          <option value="member">Membro</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMember(member.id)}
                          disabled={deletingId === member.id}
                          className="h-7 w-7 p-0 text-olive hover:text-red-600"
                        >
                          {deletingId === member.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
