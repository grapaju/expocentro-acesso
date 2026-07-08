
import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeVariant = () => {
    switch (userRole) {
      case 'admin':
        return 'default';
      case 'fornecedor':
        return 'secondary';
      case 'guarita':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrador';
      case 'fornecedor':
        return 'Fornecedor';
      case 'guarita':
        return 'Guarita';
      default:
        return '';
    }
  };

  return (
    <header className="bg-card/95 backdrop-blur border-b border-border px-4 md:px-6 2xl:px-8 py-3 md:py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-card-foreground">{currentUser?.name}</span>
          <Badge variant={getRoleBadgeVariant()}>{getRoleLabel()}</Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};

export default Header;
