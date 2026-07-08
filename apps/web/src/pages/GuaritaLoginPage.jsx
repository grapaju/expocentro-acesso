
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, ArrowLeft } from 'lucide-react';

const GuaritaLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password, 'guarita');
      if (success) {
        toast('Login realizado com sucesso');
        navigate('/guarita-access');
      } else {
        toast('Credenciais inválidas. Tente novamente.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      <Helmet>
        <title>Acesso Guarita - Expocentro Acesso</title>
        <meta name="description" content="Acesso ao sistema de controle da guarita do Expocentro" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/">
            <Button variant="ghost" className="mb-6 transition-all duration-200 hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para início
            </Button>
          </Link>

          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Acesso Guarita</CardTitle>
              <CardDescription>Entre com suas credenciais de controle de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    type="email"
                    placeholder="guarita@expocentro.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full transition-all duration-200 active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">Credenciais de demonstração:</p>
                <p className="text-sm text-foreground">Usuário: guarita@expocentro.com.br</p>
                <p className="text-sm text-foreground">Senha: 123456</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default GuaritaLoginPage;
