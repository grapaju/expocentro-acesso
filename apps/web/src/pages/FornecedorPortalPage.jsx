
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { FornecedorSidebar } from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFornecedorData } from '@/hooks/useFornecedorData.js';
import { SummaryCard, StatusBadge } from '@/components/PortalUI.jsx';
import { toast } from 'sonner';
import { 
  CalendarDays, Users, AlertCircle, CheckCircle2, 
  Wallet, AlertTriangle, UserPlus, FileCheck, ArrowRight, Send
} from 'lucide-react';

const FornecedorPortalPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { events, stats, pendingItems, submitListForApproval } = useFornecedorData();

  const handleSubmitList = () => {
    const submitted = submitListForApproval();
    if (submitted > 0) {
      toast.success(`Lista enviada para aprovacao com ${submitted} pessoa(s).`);
      return;
    }

    toast.info('Nenhuma pessoa pendente para envio neste fornecedor.');
  };

  const getEventStatusBadge = (status) => {
    const map = {
      'Aprovado': 'bg-muted/50 text-foreground border-border',
      'Aguardando aprovação': 'bg-muted/30 text-muted-foreground border-border',
      'Correção solicitada': 'bg-muted/40 text-foreground border-border',
      'Bloqueado': 'bg-muted/20 text-muted-foreground border-border'
    };
    return <Badge variant="outline" className={`font-medium ${map[status] || 'bg-muted'}`}>{status}</Badge>;
  };

  const getTaxaBadge = (taxa) => {
    if (taxa === 'Paga') return <Badge variant="outline" className="bg-muted/30 text-foreground border-border">Paga</Badge>;
    if (taxa === 'Pendente') return <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border">Pendente</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">{taxa}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Dashboard do Fornecedor - Expocentro Acesso</title>
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <FornecedorSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Greeting */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Olá, {currentUser?.name || 'Fornecedor'}</h1>
                  <p className="text-muted-foreground mt-1">Acompanhe seus credenciamentos e eventos vinculados.</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/pessoas-cadastradas')}
                    className="bg-card text-card-foreground border-border hover:bg-muted"
                  >
                    Ver equipe
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSubmitList}
                    className="bg-card text-card-foreground border-border hover:bg-muted"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar lista para aprovação
                  </Button>
                  <Button 
                    onClick={() => navigate('/cadastro-pessoas')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar pessoas
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <SummaryCard 
                  title="Meus eventos" 
                  value={stats.totalEvents} 
                  icon={CalendarDays} 
                  colorClass="bg-muted/40 text-foreground" 
                />
                <SummaryCard 
                  title="Total equipe" 
                  value={stats.totalPeople} 
                  icon={Users} 
                  colorClass="bg-muted/40 text-foreground" 
                />
                <SummaryCard 
                  title="Pendentes" 
                  value={stats.pendingPeople} 
                  icon={AlertCircle} 
                  colorClass="bg-muted/40 text-foreground" 
                />
                <SummaryCard 
                  title="Aprovadas" 
                  value={stats.approvedPeople} 
                  icon={CheckCircle2} 
                  colorClass="bg-muted/40 text-foreground" 
                />
                <SummaryCard 
                  title="Taxas pendentes" 
                  value={stats.pendingFees} 
                  icon={Wallet} 
                  colorClass="bg-muted/40 text-foreground" 
                />
                <SummaryCard 
                  title="A corrigir" 
                  value={stats.correctionsRequested} 
                  icon={AlertTriangle} 
                  colorClass="bg-muted/40 text-foreground" 
                />
              </div>

              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle>Pendências reais</CardTitle>
                  <CardDescription>Itens em aberto vinculados ao fornecedor logado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {pendingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma pendência crítica no momento.</p>
                  ) : (
                    pendingItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-sm font-medium text-foreground">{item.tipo}: {item.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.detalhe}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Events Table */}
              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle>Eventos Vinculados</CardTitle>
                  <CardDescription>Eventos onde sua empresa possui credenciamento ativo ou em andamento.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableHead className="w-[250px]">Evento</TableHead>
                        <TableHead>Período / Prazo</TableHead>
                        <TableHead>Status / Equipe</TableHead>
                        <TableHead>Taxa / Normas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((evt) => (
                        <TableRow key={evt.id} className="hover:bg-muted/30 transition-colors group">
                          <TableCell>
                            <p className="font-semibold text-foreground">{evt.name}</p>
                            <Badge variant="secondary" className="mt-1 bg-secondary/10 text-secondary hover:bg-secondary/20">
                              {evt.credenciamentoStatus}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm text-foreground flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                {evt.period}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Prazo envio: <span className="font-medium text-foreground">{evt.prazoEnvio}</span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              {getEventStatusBadge(evt.statusFornecedor)}
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <strong>{evt.pessoasCadastradas}</strong> cadastradas
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              {getTaxaBadge(evt.taxa)}
                              {evt.aceiteNormas ? (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" /> Normas aceitas
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Falta aceite
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10">
                              Detalhes <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default FornecedorPortalPage;
