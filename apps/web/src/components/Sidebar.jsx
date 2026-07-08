
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Users,
  UserCheck, 
  FileBarChart, 
  Handshake,
  Settings, 
  Home, 
  LogOut,
  CheckCircle,
  Clock,
  History,
  ShieldAlert
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: UserCheck, label: 'Credenciamento', path: '/credenciamento' },
    { icon: Handshake, label: 'Fornecedores Parceiros', path: '/admin/fornecedores-parceiros' },
    { icon: ShieldAlert, label: 'Guarita', path: '/admin/guarita' },
    { icon: FileBarChart, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' }
  ];

  return (
    <aside className="w-[14.5rem] xl:w-64 bg-[hsl(var(--sidebar-bg))] border-r border-white/10 h-screen flex flex-col sticky top-0 shrink-0 z-20 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Expocentro Acesso</h2>
        <p className="text-sm text-[hsl(var(--sidebar-muted))] mt-1">Painel Administrativo</p>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold hover:bg-[hsl(var(--sidebar-active-bg))]'
                    : 'text-[hsl(var(--sidebar-fg))] hover:bg-white/7 hover:text-[hsl(var(--sidebar-fg))]'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        {location.pathname.startsWith('/credenciamento') ? (
          <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white mb-2">Credenciamento</p>
            <ul className="space-y-1 text-xs text-[hsl(var(--sidebar-muted))]">
              <li>Pendências</li>
              <li>Fornecedores</li>
              <li>Pessoas / Equipes</li>
              <li>Aprovações</li>
              <li>Histórico de Decisões</li>
            </ul>
          </div>
        ) : null}

        {location.pathname.startsWith('/admin/guarita') ? (
          <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white mb-2">Central da Guarita</p>
            <ul className="space-y-1 text-xs text-[hsl(var(--sidebar-muted))]">
              <li>Solicitações pendentes</li>
              <li>Liberações emergenciais</li>
              <li>Entradas e saídas</li>
              <li>Bloqueios</li>
              <li>Histórico da guarita</li>
            </ul>
          </div>
        ) : null}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Button 
          variant="outline" 
          className="w-full justify-start transition-all duration-200 border-white/20 bg-transparent text-[hsl(var(--sidebar-fg))] hover:bg-white/8 hover:text-[hsl(var(--sidebar-fg))] active:scale-[0.98]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

const FornecedorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard Fornecedor', path: '/fornecedor-portal' },
    { icon: Users, label: 'Minha Equipe', path: '/pessoas-cadastradas' }
  ];

  return (
    <aside className="w-[14.5rem] xl:w-64 bg-[hsl(var(--sidebar-bg))] border-r border-white/10 h-screen flex flex-col sticky top-0 shrink-0 z-20 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Expocentro Acesso</h2>
        <p className="text-sm text-[hsl(var(--sidebar-muted))] mt-1">Portal do Fornecedor</p>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold hover:bg-[hsl(var(--sidebar-active-bg))]'
                    : 'text-[hsl(var(--sidebar-fg))] hover:bg-white/7 hover:text-[hsl(var(--sidebar-fg))]'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Button 
          variant="outline" 
          className="w-full justify-start transition-all duration-200 border-white/20 bg-transparent text-[hsl(var(--sidebar-fg))] hover:bg-white/8 hover:text-[hsl(var(--sidebar-fg))] active:scale-[0.98]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

const GuaritaSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: CheckCircle, label: 'Liberação de Acesso', path: '/guarita-access' },
    { icon: Clock, label: 'Solicitações Enviadas', path: '/guarita-solicitacoes' },
    { icon: History, label: 'Histórico de Entradas', path: '/guarita-historico' }
  ];

  return (
    <aside className="w-[14.5rem] xl:w-64 bg-[hsl(var(--sidebar-bg))] border-r border-white/10 h-screen flex flex-col sticky top-0 shrink-0 z-20 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Expocentro Acesso</h2>
        <p className="text-sm text-[hsl(var(--sidebar-muted))] mt-1">Controle de Guarita</p>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path) || (item.path === '/guarita-access' && location.pathname === '/guarita');
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start mb-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold'
                    : 'text-[hsl(var(--sidebar-fg))] hover:bg-white/7 hover:text-[hsl(var(--sidebar-fg))]'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Button 
          variant="ghost" 
          className="w-full justify-start transition-all duration-200 hover:bg-white/8 hover:text-[hsl(var(--sidebar-fg))] text-[hsl(var(--sidebar-muted))]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Encerrar Turno
        </Button>
      </div>
    </aside>
  );
};

export { AdminSidebar, FornecedorSidebar, GuaritaSidebar };
