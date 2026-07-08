
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Mail, 
  CheckCircle, 
  Building2, 
  Users, 
  FileCheck, 
  Clock, 
  BarChart,
  Shield,
  UserCheck,
  Lock
} from 'lucide-react';

const HomePage = () => {
  const processSteps = [
    {
      icon: Mail,
      title: 'Receba o link ou código do evento',
      description: 'O Expocentro enviará um convite com as informações necessárias para iniciar o credenciamento.'
    },
    {
      icon: CheckCircle,
      title: 'Valide o convite de credenciamento',
      description: 'Utilize o código recebido para validar seu acesso ao sistema de credenciamento.'
    },
    {
      icon: Building2,
      title: 'Cadastre sua empresa',
      description: 'Preencha os dados da sua empresa, incluindo CNPJ, razão social e informações de contato.'
    },
    {
      icon: Users,
      title: 'Cadastre os profissionais com CPF e foto',
      description: 'Adicione todos os membros da equipe que precisarão de acesso, com documentos e fotos.'
    },
    {
      icon: FileCheck,
      title: 'Aceite as normas de acesso',
      description: 'Leia e aceite os termos de uso e normas de segurança do Expocentro.'
    },
    {
      icon: Clock,
      title: 'Aguarde aprovação do Expocentro',
      description: 'Nossa equipe analisará seu cadastro e aprovará o acesso dos profissionais.'
    },
    {
      icon: BarChart,
      title: 'Acompanhe pendências pelo Portal do Fornecedor',
      description: 'Acesse o portal para verificar o status das aprovações e resolver pendências.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Expocentro Acesso - Credenciamento de Fornecedores e Equipes</title>
        <meta name="description" content="Sistema de credenciamento para fornecedores e equipes do Expocentro. Cadastre sua empresa e profissionais para acesso aos eventos." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1562969113-c5d9fde25b6c)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
                Credenciamento de Fornecedores e Equipes
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12">
                Cadastre sua empresa e os profissionais que atuarão no evento. O acesso ao Expocentro será permitido somente após análise e aprovação da administração.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
            >
              <Link to="/validar-convite">
                <Button 
                  size="lg" 
                  className="w-full bg-white text-primary hover:bg-white/90 transition-all duration-200 active:scale-[0.98] h-auto py-4 border-2 border-transparent"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  <span className="text-left">
                    <span className="block text-sm font-normal">Iniciar cadastro</span>
                    <span className="block font-semibold">com convite</span>
                  </span>
                </Button>
              </Link>

              <Link to="/fornecedor-login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full bg-transparent text-white border-white hover:bg-white/10 transition-all duration-200 active:scale-[0.98] h-auto py-4"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  <span className="text-left">
                    <span className="block text-sm font-normal">Entrar no</span>
                    <span className="block font-semibold">Portal do Fornecedor</span>
                  </span>
                </Button>
              </Link>

              <Link to="/admin-login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full bg-transparent text-white border-white hover:bg-white/10 transition-all duration-200 active:scale-[0.98] h-auto py-4"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="text-left">
                    <span className="block text-sm font-normal">Acesso</span>
                    <span className="block font-semibold">Administrativo</span>
                  </span>
                </Button>
              </Link>

              <Link to="/guarita-login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full bg-transparent text-white border-white hover:bg-white/10 transition-all duration-200 active:scale-[0.98] h-auto py-4"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  <span className="text-left">
                    <span className="block text-sm font-normal">Acesso</span>
                    <span className="block font-semibold">Guarita</span>
                  </span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Process Steps Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Como funciona o processo de credenciamento
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Siga estes passos para garantir o acesso da sua equipe aos eventos do Expocentro
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full transition-all duration-200 border-border bg-card">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-4xl font-bold text-muted-foreground/30">{index + 1}</span>
                          <CardTitle className="text-lg leading-snug">{step.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base leading-relaxed">
                          {step.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-2xl font-bold">Expocentro Acesso</p>
                <p className="text-sm text-primary-foreground/80 mt-1">Sistema de Credenciamento</p>
              </div>
              <div className="flex gap-6 text-sm">
                <Link to="/privacy" className="hover:underline transition-all duration-200">
                  Política de Privacidade
                </Link>
                <Link to="/terms" className="hover:underline transition-all duration-200">
                  Termos de Uso
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
              <p className="text-sm text-primary-foreground/70">
                © 2026 Expocentro. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
