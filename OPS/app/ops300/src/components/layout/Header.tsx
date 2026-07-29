import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { ChevronRight, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DailyNotifications from '@/components/DailyNotifications';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const breadcrumbs = useBreadcrumbs();

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Utilizador';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-line bg-ivory/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-line/40 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} strokeWidth={1.5} className="text-ink" />
        </button>
        <nav className="flex items-center gap-1.5 text-sm text-olive font-sans min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight size={13} className="text-olive/50 shrink-0" />}
              {crumb.isLast ? (
                <span className="text-ink truncate">{crumb.label}</span>
              ) : crumb.path ? (
                <button
                  onClick={() => navigate(crumb.path!)}
                  className="hover:text-ink transition-colors truncate"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <div className="hidden sm:block text-xs text-olive font-sans">
          {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <DailyNotifications />
          <button
            onClick={() => navigate('/perfil')}
            className="flex items-center gap-2 text-sm text-ink font-sans hover:opacity-70 transition-opacity"
          >
            <User size={14} className="text-olive" strokeWidth={1.5} />
            <span className="hidden sm:inline">{displayName}</span>
          </button>
          <button
            onClick={() => navigate('/perfil')}
            className="w-8 h-8 rounded-full bg-ink text-ivory flex items-center justify-center text-xs font-sans hover:opacity-90 transition-opacity"
          >
            {initials}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-olive hover:text-ink hover:bg-line/30"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </header>
  );
}
