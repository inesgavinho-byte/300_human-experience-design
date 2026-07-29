import { Routes, Route, Navigate } from 'react-router';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AuthCallback from '@/pages/AuthCallback';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import Clients from '@/pages/Clients';
import ClientDetailPage from '@/pages/ClientDetailPage';
import Proposals from '@/pages/Proposals';
import ProposalDetailPage from '@/pages/ProposalDetailPage';
import SystemConfig from '@/pages/SystemConfig';
import SystemConfigDetailPage from '@/pages/SystemConfigDetailPage';
import Documentation from '@/pages/Documentation';
import Catalog from '@/pages/Catalog';
import Tasks from '@/pages/Tasks';
import Suppliers from '@/pages/Suppliers';
import Maintenance from '@/pages/Maintenance';
import MaintenanceHistory from '@/pages/MaintenanceHistory';
import Finance from '@/pages/Finance';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import NotificationSettings from '@/pages/NotificationSettings';
import Profile from '@/pages/Profile';
import Team from '@/pages/Team';
import CalendarPage from '@/pages/CalendarPage';
import SystemWizardPage from '@/pages/SystemWizardPage';
import TemplateComparePage from '@/pages/TemplateComparePage';
import Procurement from '@/pages/Procurement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-ink">300</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-ink">300</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-ink">300</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(roles)) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-4xl text-ink">300</h1>
          <p className="text-olive font-sans">Não tem permissão para aceder a esta página.</p>
          <a href="/" className="text-ink underline font-sans">Voltar ao Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/registo" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/recuperar-palavra-passe" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/redefinir-palavra-passe" element={<AuthRoute><ResetPassword /></AuthRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projetos" element={<Projects />} />
                <Route path="/projetos/:id" element={<ProjectDetailPage />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/propostas" element={<Proposals />} />
                <Route path="/propostas/:id" element={<ProposalDetailPage />} />
                <Route path="/configuracoes-sistema" element={<SystemConfig />} />
                <Route path="/configuracoes-sistema/:id" element={<SystemConfigDetailPage />} />
                <Route path="/documentacao" element={<Documentation />} />
                <Route path="/catalogo" element={<Catalog />} />
                <Route path="/fornecedores" element={<Suppliers />} />
                <Route path="/procurement" element={<Procurement />} />
                <Route path="/tarefas" element={<Tasks />} />
                <Route path="/calendario" element={<CalendarPage />} />
                <Route path="/wizard" element={<SystemWizardPage />} />
                <Route path="/wizard/compare" element={<TemplateComparePage />} />
                <Route path="/manutencao" element={<Maintenance />} />
                <Route path="/manutencao/historico" element={<MaintenanceHistory />} />
                <Route path="/financeiro" element={<Finance />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/notificacoes" element={<NotificationSettings />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/equipa" element={<RoleRoute roles={['admin', 'manager']}><Team /></RoleRoute>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
