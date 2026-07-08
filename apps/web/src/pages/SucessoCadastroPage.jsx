
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCheck, Home } from 'lucide-react';

const SucessoCadastroPage = () => {
  return (
    <>
      <Helmet>
        <title>Cadastro Enviado - Expocentro Acesso</title>
        <meta name="description" content="Seu cadastro foi enviado com sucesso" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-border text-center overflow-hidden">
            <div className="bg-muted h-2 w-full"></div>
            <CardHeader className="pt-10 pb-6">
              <div className="mx-auto w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Cadastro enviado para análise!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-10">
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                Cadastro enviado para análise. Enviamos as instruções de acesso ao Portal do Fornecedor para o e-mail informado.
              </CardDescription>

              <div className="space-y-3 pt-4 border-t border-border">
                <Link to="/fornecedor-login" className="block w-full">
                  <Button className="w-full h-12 text-base transition-all active:scale-[0.98]">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Ir para Portal do Fornecedor
                  </Button>
                </Link>
                <Link to="/" className="block w-full">
                  <Button variant="outline" className="w-full h-12 text-base transition-all active:scale-[0.98]">
                    <Home className="w-5 h-5 mr-2" />
                    Voltar para início
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SucessoCadastroPage;
