import { NavLink } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FolderOpen, Users, FileText, ClipboardCheck,
  Wrench, Settings, HardHat, CircleDollarSign, ShoppingBag, Settings2, UsersRound, BarChart3, Package, History,
  Calendar,  Bell,  Wand2,  GitCompare,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  end?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projetos', label: 'Projetos', icon: FolderOpen },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/propostas', label: 'Propostas', icon: FileText },
  { path: '/wizard', label: 'Wizard', icon: Wand2 },
  { path: '/wizard/compare', label: 'Comparador', icon: GitCompare },
  { path: '/configuracoes-sistema', label: 'Sistemas', icon: Settings2 },
  { path: '/documentacao', label: 'Documentação', icon: ClipboardCheck },
  { path: '/catalogo', label: 'Catálogo', icon: ShoppingBag },
  { path: '/fornecedores', label: 'Fornecedores', icon: UsersRound },
  { path: '/procurement', label: 'Procurement', icon: Package },
  { path: '/tarefas', label: 'Tarefas', icon: HardHat },
  { path: '/calendario', label: 'Calendário', icon: Calendar },
  { path: '/manutencao', label: 'Manutenção', icon: Wrench, roles: ['admin', 'manager'], end: true },
  { path: '/manutencao/historico', label: 'Histórico', icon: History, roles: ['admin', 'manager'] },
  { path: '/financeiro', label: 'Finanças', icon: CircleDollarSign, roles: ['admin', 'manager'] },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'manager'] },
  { path: '/equipa', label: 'Equipa', icon: UsersRound, roles: ['admin', 'manager'] },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/notificacoes', label: 'Notificações', icon: Bell },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { hasRole } = useAuth();

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[240px] bg-ivory border-r border-line flex-col z-50">
        <div className="h-16 flex items-center px-6 border-b border-line">
          <span className="font-serif text-2xl tracking-widest text-ink">300</span>
          <span className="ml-2 text-[10px] uppercase tracking-widest text-olive font-sans">OPS</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isSubItem = item.path.startsWith('/manutencao/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-ink text-ivory'
                      : 'text-ink hover:bg-line/40'
                  } ${isSubItem ? 'ml-4' : ''}`
                }
              >
                <Icon size={16} strokeWidth={1.5} />
                <span className="font-sans">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-line">
          <p className="text-[10px] text-olive font-sans">© 2025 300 — Human Experience Design</p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-screen w-[260px] bg-ivory border-r border-line flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-5 border-b border-line">
              <div className="flex items-center">
                <span className="font-serif text-2xl tracking-widest text-ink">300</span>
                <span className="ml-2 text-[10px] uppercase tracking-widest text-olive font-sans">OPS</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-line/40 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={18} strokeWidth={1.5} className="text-ink" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isSubItem = item.path.startsWith('/manutencao/');
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-ink text-ivory'
                          : 'text-ink hover:bg-line/40'
                      } ${isSubItem ? 'ml-4' : ''}`
                    }
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="font-sans">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="px-5 py-4 border-t border-line">
              <p className="text-[10px] text-olive font-sans">© 2025 300 — Human Experience Design</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
